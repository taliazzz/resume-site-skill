#!/usr/bin/env node
/**
 * check.mjs — 站点部署前自检
 *
 * 用法：
 *   node scripts/check.mjs <站点目录>            # 检查占位符残留 + 引用文件存在 + 文件名合规
 *   node scripts/check.mjs --zip out.zip        # 检查 zip 条目分隔符（反斜杠坑）
 * 两者可同时使用：
 *   node scripts/check.mjs <站点目录> --zip out.zip
 *
 * 退出码 0 = 全部通过；1 = 有问题（逐条列出）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { argv, exit } from 'node:process';

function arg(name) {
  const i = argv.indexOf('--' + name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

const problems = [];
let checked = false;

/* ---------- 1. zip 条目分隔符检查 ---------- */
const zipPath = arg('zip');
if (zipPath) {
  checked = true;
  if (!existsSync(zipPath)) {
    problems.push('zip 文件不存在: ' + zipPath);
  } else {
    const buf = readFileSync(zipPath);
    // 遍历 local file header（签名 PK\x03\x04），读文件名
    let i = 0, entries = [];
    while (i < buf.length - 4) {
      if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x03 && buf[i + 3] === 0x04) {
        const nameLen = buf.readUInt16LE(i + 26);
        const extraLen = buf.readUInt16LE(i + 28);
        entries.push(buf.slice(i + 30, i + 30 + nameLen).toString('utf8'));
        i += 30 + nameLen + extraLen;
      } else i++;
    }
    const bad = entries.filter((e) => e.includes('\\'));
    if (bad.length) {
      problems.push('zip 条目使用反斜杠分隔（部分平台会拒收），请用 scripts/pack.mjs 重新打包。共 ' + bad.length + ' 条，如: ' + bad.slice(0, 3).join(', '));
    } else {
      console.log('[check] zip 分隔符 OK（' + entries.length + ' 条，无反斜杠）');
      if (!entries.some((e) => e === 'index.html' || e === './index.html')) {
        problems.push('zip 根目录缺少 index.html（当前根级条目: ' + entries.filter((e) => !e.includes('/')).join(', ') + '）');
      } else {
        console.log('[check] zip 根目录含 index.html OK');
      }
    }
  }
}

/* ---------- 2. 站点目录检查 ---------- */
const siteDir = argv.filter((a) => !a.startsWith('--') && a !== argv[0] && a !== 'check.mjs' && a !== import.meta.url.split('/').pop()).find((a) => statSyncSafe(a));
function statSyncSafe(p) { try { return statSync(p).isDirectory(); } catch { return false; } }

if (siteDir) {
  checked = true;
  const dir = resolve(siteDir);
  const htmlPath = join(dir, 'index.html');
  if (!existsSync(htmlPath)) {
    problems.push('目录中缺少 index.html: ' + dir);
  } else {
    const html = readFileSync(htmlPath, 'utf8');

    // 2a. 占位符残留
    const leftover = html.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
    if (leftover.length) {
      problems.push('index.html 有 ' + leftover.length + ' 处占位符残留: ' + [...new Set(leftover)].join(', '));
    } else {
      console.log('[check] 占位符 OK（无残留 {{...}}）');
    }

    // 2b. 引用的本地文件是否存在（先剥掉 HTML 注释，避免把注释里的示例当引用）
    const htmlNoComment = html.replace(/<!--[\s\S]*?-->/g, '');
    const refs = new Set();
    for (const m of htmlNoComment.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const u = m[1];
      if (u.startsWith('data:') || u.startsWith('#') || /^(https?:|mailto:|tel:)/.test(u)) continue;
      refs.add(u.split('#')[0].split('?')[0]);
    }
    for (const r of refs) {
      if (!r) continue;
      if (!existsSync(join(dir, decodeURIComponent(r)))) {
        problems.push('引用的文件不存在: ' + r);
      }
    }
    if (!problems.length || problems.every((p) => !p.startsWith('引用的文件'))) {
      console.log('[check] 引用文件 OK（' + refs.size + ' 个本地引用全部存在）');
    }

    // 2c. 非英文文件名（部署平台 URL 编码风险）
    const nonAscii = [];
    (function walk(d) {
      for (const f of readdirSync(d)) {
        const full = join(d, f);
        if (statSync(full).isDirectory()) walk(full);
        else if (/[^\x20-\x7E]/.test(f)) nonAscii.push(relative(dir, full));
      }
    })(dir);
    if (nonAscii.length) {
      problems.push('存在非英文文件名（部署平台 URL 编码风险）: ' + nonAscii.join(', '));
    } else {
      console.log('[check] 文件名 OK（全部英文）');
    }

    // 2d. 打包遗留物
    for (const junk of ['preview.png', 'debug.png', 'node_modules', '.DS_Store', 'Thumbs.db']) {
      if (existsSync(join(dir, junk))) problems.push('打包遗留物应移除: ' + junk);
    }
  }
}

if (!checked) {
  console.error('用法: node scripts/check.mjs <站点目录> [--zip out.zip]');
  exit(2);
}

if (problems.length) {
  console.error('[check] ✗ 发现 ' + problems.length + ' 个问题:');
  problems.forEach((p) => console.error('  - ' + p));
  exit(1);
}
console.log('[check] ✓ 全部通过');
