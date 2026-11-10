# Changelog

本文件记录技能包的所有重要变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

<!-- 日常改动先记在这里，发版时整体移到对应版本号下 -->

## [1.0.0] - 2026-11-10

### Added
- 开箱即跑的简历站模板：四页签 SPA（hash 路由）、鼠标公转气泡、状态胶囊轮播、手写体标题、PC/移动双适配
- 模板内置占位资源：占位 PDF、3 张占位项目图、自托管 Caveat woff2 字体（离线可用）
- `scripts/replace.mjs`：读取 data.json 批量替换占位符（174 处字段），含残留检查
- `scripts/check.mjs`：部署前自检（占位符残留 / 引用文件存在性 / 非英文文件名 / 调试遗留物 / zip 分隔符与根目录 index.html）
- `scripts/pack.mjs`：零依赖标准 zip 打包，规避 Windows `Compress-Archive` 反斜杠坑
- `scripts/data.example.json`：完整替换数据示例
- 分享 meta（og:title/description/image）、内联 SVG favicon
- 微信内置浏览器下载提示（UA 检测 + 长按保存引导）
- 文档：SKILL.md 全流程指南、CONTENT.md 占位符清单（含硬编码文案表）、guide.md 薄引用、references/cutout.md、references/platforms.md
- 项目文件：README.md、LICENSE(MIT)、.gitignore（排除含隐私的 data.json）

### Fixed
- 模板目录结构与 index.html 的 `assets/` 引用不一致导致样式/脚本 404
- `site.js` 残留未替换的 `{{PDF_FILE}}` 占位符（与"无需修改本文件"的说明矛盾）
- `style.css` 头部注释残留上一位使用者的姓名（未匿名化）
- `name` 字段与 skill 目录名不一致

### Changed
- 抠图与托管平台对比从主文档拆入 `references/`，主文档聚焦流程
- 移除"`tar -a` 打标准 zip"提示（Git Bash 下 `-a` 不产出 zip 格式，验证不可靠）
