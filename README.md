# resume-site-skill 📄

一套经过完整实战验证的 AI Agent 技能：**从零生成个人简历站（纯原生 HTML/CSS/JS）并部署上线到 Cloudflare Pages** 的全流程。

适用于 WorkBuddy、Claude Code、Trae、Cursor 等支持 Agent Skill 的工具，也可以当普通模板/教程直接使用。

## ✨ 特性

- **开箱即跑的模板**：版式、配色、动效、响应式、字体全部内置，目录结构即部署结构
- **换一份简历 = 4 步**：填 `data.json` → 跑替换脚本 → 放图片/PDF → 打包部署
- **纯原生实现**：无框架、无构建工具，单页多页签 SPA（hash 路由）+ 精致动效
- **自动化脚本**：占位符批量替换、部署前自检、标准 zip 打包（零依赖，Node 原生）
- **实战踩坑记录**：Windows/PowerShell、zip 编码、微信内置浏览器、三大免费托管平台对比

## 📁 目录结构

```
resume-site-skill/
├── SKILL.md                ← 技能主文档（Agent 读取的入口）
├── CONTENT.md              ← 占位符清单 + 硬编码文案说明
├── guide.md                ← 给任何 AI Agent 的使用说明
├── template/               ← 开箱即跑的可运行模板
│   ├── index.html
│   └── assets/（style.css / site.js / 字体 / 占位 PDF / 占位图）
├── scripts/
│   ├── replace.mjs         ← 读 data.json 批量替换占位符
│   ├── check.mjs           ← 自检：残留占位符 / 引用文件 / zip 分隔符
│   ├── pack.mjs            ← 打标准 zip（规避 Windows 反斜杠坑）
│   └── data.example.json   ← 替换数据示例
└── references/
    ├── cutout.md           ← 图片抠图方案（可选步骤）
    └── platforms.md        ← 免费托管平台对比与部署细节
```

## 🚀 快速开始

### 方式一：作为 Agent Skill 安装

把整个 `resume-site-skill/` 文件夹放入你的 Agent 工具的 skills 目录（如 WorkBuddy 的 `~/.workbuddy/skills/`），然后对 Agent 说：

> 帮我做一个个人简历网站，附上我的简历 PDF / 文字素材

Agent 会自动按 `SKILL.md` 的流程走完「生成 → 自检 → 打包 → 部署」。

### 方式二：直接当模板用（不依赖 Agent）

```bash
# 1. 复制模板
cp -r template/ my-resume/
cd my-resume

# 2. 填写 data.json（参考 scripts/data.example.json），批量替换占位符
node ../scripts/replace.mjs --data ../data.json --target index.html

# 3. 放入简历 PDF（assets/resume.pdf）和项目图（assets/work/）

# 4. 自检 + 打包
node ../scripts/check.mjs .
node ../scripts/pack.mjs . -o site.zip
```

生成的 `site.zip` 拖入 [Cloudflare Pages](https://dash.cloudflare.com)（直接上传）即可得到 `https://你的项目名.pages.dev`，全程免费。

## 📝 换人使用（核心工作流）

| 步骤 | 操作 |
|---|---|
| 1 | 复制 `template/` 为工作目录，参考 `scripts/data.example.json` 填写 `data.json` |
| 2 | `node scripts/replace.mjs --data data.json --target index.html` 批量替换 |
| 3 | 放入英文命名的简历 PDF 和项目图（文件名与 `data.json` 中 `P*_IMG` 一致） |
| 4 | `node scripts/check.mjs .` 自检 → `node scripts/pack.mjs . -o site.zip` → 部署 |

只改内容和 `:root` 配色变量，**不需要动 CSS 布局和 JS 逻辑**。

## ☁️ 托管平台怎么选

| 平台 | 国内访问 | 说明 |
|---|---|---|
| **Cloudflare Pages**（推荐） | 可用 | 免费、稳定、无密码门，拖 zip 约 1 分钟上线 |
| Netlify Drop | 可用 | 免注册试水，但匿名站有密码门且 1 小时过期 |
| 腾讯云 EdgeOne Pages | 最快 | 国内 CDN，投递国内公司时优先 |

详细部署步骤、更新站点流程见 [references/platforms.md](references/platforms.md)。

## ❓ 常见问题

- **改了文件刷新没变化？** 本地服务器加 `Cache-Control: no-cache` 响应头
- **上传报「文件名包含非法字符」？** 用 `scripts/pack.mjs` 重打 zip，不要用 `Compress-Archive`
- **微信里下载按钮没反应？** 微信内置浏览器不支持下载，页面会自动显示长按保存提示
- **更多**：见 `SKILL.md` 第 11 节「常见问题速查」

## 📄 许可证

[MIT](LICENSE)
