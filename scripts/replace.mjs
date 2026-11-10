#!/usr/bin/env node
/**
 * replace.mjs — 批量替换模板占位符
 *
 * 用法：
 *   node scripts/replace.mjs --data data.json --target <站点目录>/index.html
 *   （--target 缺省时替换 <站点目录>/index.html，脚本自动向上找 index.html 所在目录）
 *
 * 数据文件：JSON 对象，键 = 占位符名（不带花括号），值 = 替换文本。
 * 参考 scripts/data.example.json。
 *
 * 规则：
 * - 值为 null / "" / 缺失 → 保留占位符并在结束时报告
 * - 替换后自动检查残留 {{，有残留则退出码 1
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { argv, exit } from 'node:process';

function arg(name, fallback) {
  const i = argv.indexOf('--' + name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const dataPath = arg('data', 'data.json');
let target = arg('target', '');

// 默认目标：向上两级找 index.html（scripts/../index.html 或站点目录）
if (!target) {
  target = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'index.html');
  try { readFileSync(target); } catch { target = resolve('index.html'); }
}
target = resolve(target);

let html;
try { html = readFileSync(target, 'utf8'); }
catch (e) { console.error('[replace] 找不到目标文件: ' + target); exit(1); }

let data;
try { data = JSON.parse(readFileSync(dataPath, 'utf8')); }
catch (e) { console.error('[replace] 数据文件读取/解析失败: ' + dataPath + '\n' + e.message); exit(1); }

let replaced = 0, missing = [];
for (const [key, value] of Object.entries(data)) {
  const tag = '{{' + key + '}}';
  const count = html.split(tag).length - 1;
  if (count === 0) { missing.push(key + '（模板中未出现，检查拼写）'); continue; }
  if (value === null || value === undefined || String(value).trim() === '') {
    missing.push(key + '（值为空，未替换）');
    continue;
  }
  html = html.split(tag).join(String(value));
  replaced += count;
}
writeFileSync(target, html);
console.log('[replace] 已替换 ' + replaced + ' 处 → ' + target);

// 残留检查
const leftover = html.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
if (leftover.length) {
  const uniq = [...new Set(leftover)];
  console.error('[replace] ⚠ 仍有 ' + leftover.length + ' 处占位符未替换: ' + uniq.join(', '));
  exit(1);
}
if (missing.length) {
  console.warn('[replace] 提示:\n  - ' + missing.join('\n  - '));
}
console.log('[replace] ✓ 完成（无残留占位符）');
