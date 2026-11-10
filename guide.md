# 使用说明（给任何 AI Agent）

> 本 skill 用于生成个人简历站（纯原生 HTML/CSS/JS）并部署上线。
> **主文档是 `SKILL.md`**：全流程、设计规范、Windows 实战坑、部署与验证都在那里，本文件不再重复。
> 配套：`CONTENT.md`（占位符清单）、`template/`（可运行模板）、`scripts/`（自动化）、`references/`（抠图与平台细节）。

## 快速开始（换一份简历 = 4 步）

1. 把整个 `template/` 目录复制为工作目录（结构即部署结构，开箱即跑）
2. 参考 `scripts/data.example.json` 填写 `data.json`，然后：
   `node scripts/replace.mjs --data data.json --target index.html`
3. 放入英文命名的简历 PDF（`assets/`）和项目图（`assets/work/`）
4. `node scripts/check.mjs .` 自检 → `node scripts/pack.mjs . -o site.zip` → 按 SKILL.md §8-§10 部署

## 三条纪律

- **不要改 `assets/style.css` 的布局规则和 `assets/site.js` 的交互逻辑**——这正是风格一致的保障（换肤只动 `:root` 变量）
- **不要手工打 zip**——用 `scripts/pack.mjs`，PowerShell `Compress-Archive` 的反斜杠坑见 SKILL.md §7
- **部署前必跑 `scripts/check.mjs`**——占位符残留、引用缺失、非法文件名它都会抓出来

需要抠图或选择托管平台时，分别看 `references/cutout.md` 和 `references/platforms.md`。
