#!/usr/bin/env node
/**
 * pack.mjs — 打标准 zip（index.html 必须在包根目录）
 *
 * 用法：
 *   node scripts/pack.mjs <站点目录> -o site.zip
 *
 * 背景：Windows PowerShell 的 Compress-Archive 打出的 zip 条目用 `\` 分隔，
 * Cloudflare/EdgeOne 等平台会报「文件名包含非法字符 \ / : * ?」。本脚本用
 * Node 原生 zlib 打标准 zip（`/` 分隔，deflate 压缩），零依赖。
 *
 * 自动排除：node_modules、.DS_Store、Thumbs.db、desktop.ini、*.mjs、data*.json
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { argv, exit } from 'node:process';
import { deflateRawSync } from 'node:zlib';

/* ---------- zip 基础设施 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(d) {
  return {
    time: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xffff,
    date: (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff,
  };
}

const EXCLUDE = new Set(['node_modules', '.DS_Store', 'Thumbs.db', 'desktop.ini']);
const EXCLUDE_EXT = ['.mjs'];
const EXCLUDE_PREFIX = ['data'];

/* ---------- 收集文件 ---------- */
const args = argv.slice(2);
const outIdx = args.indexOf('-o');
const outPath = outIdx !== -1 ? args[outIdx + 1] : 'site.zip';
const siteDir = args.find((a) => a !== '-o' && a !== outPath) || '.';

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    if (EXCLUDE.has(f) || EXCLUDE_EXT.some((e) => f.endsWith(e)) || EXCLUDE_PREFIX.some((p) => f.startsWith(p))) continue;
    const full = join(d, f);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
})(siteDir);

if (!files.some((f) => relative(siteDir, f) === 'index.html')) {
  console.error('[pack] ✗ 站点根目录缺少 index.html: ' + siteDir);
  exit(1);
}

/* ---------- 写 zip（local headers + central directory） ---------- */
const locals = [], centrals = [], offsets = [];
let total = 0;
for (const f of files) {
  const name = relative(siteDir, f).split(sep).join('/');   // 强制 `/` 分隔
  const data = readFileSync(f);
  const compressed = deflateRawSync(data, { level: 9 });
  const useDeflate = compressed.length < data.length;
  const payload = useDeflate ? compressed : data;
  const { time, date } = dosTime(statSync(f).mtime);
  const crc = crc32(data);

  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0);
  lh.writeUInt16LE(20, 4);                       // version needed
  lh.writeUInt16LE(0x0800, 6);                   // UTF-8 flag
  lh.writeUInt16LE(useDeflate ? 8 : 0, 8);       // method
  lh.writeUInt16LE(time, 10);
  lh.writeUInt16LE(date, 12);
  lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(payload.length, 18);
  lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(name.length, 26);

  offsets.push(total);
  locals.push(lh, Buffer.from(name, 'utf8'), payload);

  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0);
  ch.writeUInt16LE(20, 4);
  ch.writeUInt16LE(20, 6);
  ch.writeUInt16LE(0x0800, 8);
  ch.writeUInt16LE(useDeflate ? 8 : 0, 10);
  ch.writeUInt16LE(time, 12);
  ch.writeUInt16LE(date, 14);
  ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(payload.length, 20);
  ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(name.length, 28);
  ch.writeUInt32LE(offsets[offsets.length - 1], 42);
  centrals.push(ch, Buffer.from(name, 'utf8'));
  total += lh.length + name.length + payload.length;
}

const cdStart = total;
let cdSize = 0;
for (const b of centrals) cdSize += b.length;
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(cdSize, 12);
eocd.writeUInt32LE(cdStart, 16);

writeFileSync(outPath, Buffer.concat([...locals, ...centrals, eocd]));
const kb = (statSync(outPath).size / 1024).toFixed(1);
console.log('[pack] ✓ ' + outPath + '（' + files.length + ' 个文件，' + kb + ' KB，标准 `/` 分隔 zip）');
