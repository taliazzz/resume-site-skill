---
name: resume-site-skill
description: 从零生成个人简历站（纯原生 HTML/CSS/JS）并部署上线到 Cloudflare Pages 的全流程技能。覆盖设计规范、Windows 开发调试、打包规范、免费托管平台实测对比（EdgeOne Pages / Netlify Drop / Cloudflare Pages）、部署后验证清单与站点更新流程。当用户要求制作或修改个人简历网站、作品集站点，或将静态站点打包上传部署上线时使用。
---

# 简历站开发 + Cloudflare 部署全流程

一套经过完整实战验证的流程：从设计规范到代码实现，从本地调试到云端上线。
适用场景：个人简历站、作品集、任意纯静态站点的快速生成与部署。

## 目录结构

```
resume-site-skill/
├── SKILL.md                ← 本文件（主流程）
├── CONTENT.md              ← 占位符替换清单（硬编码文案也在这里）
├── guide.md                ← 给任何 AI Agent 的使用说明（薄引用）
├── template/               ← 开箱即跑的可运行模板
│   ├── index.html          ← 占位符版（{{...}} 字段）
│   └── assets/
│       ├── style.css       ← 风格层，换肤只动 :root 变量
│       ├── site.js         ← 交互层，无需修改
│       ├── caveat-latin*.woff2  ← 自托管手写体，离线可用
│       ├── resume.pdf      ← 占位 PDF（替换成真实简历）
│       └── work/           ← 占位项目图（替换成真实截图）
├── scripts/                ← 自动化（强烈推荐使用）
│   ├── data.example.json   ← 替换数据示例
│   ├── replace.mjs         ← 读 data.json 批量替换占位符
│   ├── check.mjs           ← 自检：残留占位符 / 引用文件 / zip 分隔符
│   └── pack.mjs            ← 打标准 zip（规避 Compress-Archive 反斜杠坑）
└── references/
    ├── cutout.md           ← 图片抠图方案（可选步骤）
    └── platforms.md        ← 托管平台对比与部署细节
```

## 0. 快速通道：换一份简历 = 4 步（推荐路线）

模板是**完整可运行**的（index.html 引用 `assets/`，目录结构即部署结构，含占位 PDF/图片/字体）：

1. 复制 `template/` 到工作目录；把简历内容填进 `data.json`（参考 `scripts/data.example.json`）
2. `node scripts/replace.mjs --data data.json --target index.html` 批量替换
3. 放入英文命名的简历 PDF（`assets/`）和项目图（`assets/work/`，文件名与 data.json 中 `P*_IMG` 一致）
4. `node scripts/check.mjs .` 自检 → 通过后 `node scripts/pack.mjs . -o site.zip` → 按 §8-§10 部署

只有当用户要求全新版式/不同风格时，才从 §1 开始重新开发。

## 1. 硬约束（先和用户确认，默认遵守）

1. **纯原生 HTML + CSS + JavaScript**，不引入任何框架/构建工具
2. **内容严格来自用户提供的简历**，不编造、不夸大
3. **PC + 移动端双适配**，不同设备布局合理；保留合理留白
4. 视觉风格基准：米白底、墨色正文、蓝色强调、手写体英文标题 + 黄色马克笔线（Caveat 字体已自托管在 assets/）

## 2. 设计 Tokens（直接复用）

```css
:root {
  --bg: #FEFCF6;            /* 米白页面底 */
  --ink: #1A1A2E;           /* 主文字 */
  --muted: #999999;         /* 次级文字 */
  --accent: #2B7FD8;        /* 强调蓝 */
  --accent-2: #6FB1EC;      /* 渐变辅蓝 */
  --accent-soft: #EDF4FC;   /* 浅蓝底 */
  --accent-bd: rgba(43,127,216,.28);
  --yellow: #FFD84D;        /* 黄色马克笔 */
  --hairline: #EFEAE0;      /* 发丝分隔线 */
  --card: #FFFFFF;
  --hand: "Caveat","Segoe Script","Bradley Hand",cursive;  /* 手写体标题（woff2 已内置于 assets/） */
  --sans: "PingFang SC","Noto Sans SC","Microsoft YaHei",-apple-system,"Segoe UI",sans-serif;
  --margin: clamp(24px, 5.4vw, 76px);   /* 页边距 */
}
```

## 3. SPA 架构（单文件多页签）

- 四页签 `<section id="page-{home|work|path|about}">`，`.page{display:none}` + `.page.active{display:block}`
- 路由：hash 路由 `showPage(name)` + `hashchange` 监听 + 刷新时按 `location.hash` 恢复
- 导航高亮：所有导航链接带 `data-nav` 属性，切页时同步 `aria-current`
- 进场动画：`.page.active .rv { animation: fadeUp .7s both; animation-delay: var(--d) }`，每个元素用 `style="--d:.08s"` 错开节奏
- 无障碍降级：`prefers-reduced-motion: reduce` 时关闭全部循环动画，轮播类内容提供静态兜底

## 4. 实战动效模式（可复用片段）

| 效果 | 实现要点 |
|---|---|
| 气泡随鼠标公转 | 外层 `rotate(var(--rot))` 包住轨道元素，内层 `rotate(calc(var(--rot)*-1))` 反向自转保持水平；JS：`atan2` 算角度 × 阻尼 0.3 → rAF lerp 0.06 写 CSS 变量，收敛后 cancel；仅在 `pointer:fine` 且非 reduced-motion 下启用 |
| 状态胶囊轮播 | N 个状态绝对定位叠放，`animation: xx 5N s infinite` + `animation-delay: 5i s` 错开；keyframes 只在各自 5 秒窗口内渐显 |
| 时间双缓冲 | 两个层叠 span 交替 `opacity` transition，写入新值后切层，避免跳变 |
| 呼吸页脚条 | `animation` 循环 scale/opacity；hover 想用 transition 时必须先 `animation:none`（animation 优先级覆盖 transform） |

## 5. Windows 开发调试（PowerShell 实战坑）

- **本地服务器**：临时 node http 脚本，**必须加 `Cache-Control: no-cache` 响应头**（否则改了文件刷新看不到，浪费大量排查时间）；后台启动 → curl 验 200 → 用完 `Get-NetTCPConnection` + `Stop-Process` 杀端口
- **PowerShell 5 三坑**：
  1. 不支持 `&&` → 用 `;` 分隔 + `$LASTEXITCODE` 判断
  2. 执行策略禁 npm.ps1 → 用 `npm.cmd install`
  3. CLIXML 噪声输出（profile 报错）→ 只看实际数据行，忽略 Error 块
- **验证闭环**：browser agent 跑「桌面渲染 + 4 页签切换 + 图片 0 破图 + 控制台报错 + 375px 模拟无横向溢出」；agent 报的错误先 grep 源码甄别是否为 agent 自身脚本笔误
- 交还用户操作时：**一次只引导一个页面/一个平台**，多平台并行会让用户迷失在标签页里

## 6. 图片抠图（可选）

仅彩色背景截图需要「主体贴卡」效果时使用。方案与调参细节见 `references/cutout.md`。
速记：jimp@0.22.12 纯 JS；region growing（双顶角基准 + 边缘连通 BFS + 容差两轮调优）；**白底图不要抠**。

## 7. 打包规范（部署前必查）

1. **用 `scripts/pack.mjs` 打包**，不要用 PowerShell 的 `Compress-Archive`——后者打出的 zip 条目用 `\` 分隔，部分平台报「文件名包含非法字符 \ / : * ?」
2. 打包前跑 `node scripts/check.mjs <站点目录>`：检查占位符残留、引用文件存在性、非英文文件名、调试遗留物
3. 已打好的 zip 用 `node scripts/check.mjs --zip site.zip` 复核分隔符与根目录 index.html
4. **只带被引用的文件**：index.html + CSS/JS + 图片 + PDF；调试产物（preview 拼图）、被替代的原图、脚本与数据文件不带（pack.mjs 已自动排除 scripts 类文件）
5. **中文文件名一律改英文**（如 `简历-张三.pdf` → `resume.pdf`），同步改 HTML/JS 引用——部分平台 URL 编码会出问题

## 8. 托管平台选择

三大平台实测对比、部署细节、EdgeOne 入口等见 `references/platforms.md`。
速记：**Cloudflare Pages 为默认主路线**（国内可用、免费稳定）；Netlify Drop 仅试水（匿名站有密码门且 1 小时过期）；EdgeOne 国内速度优先时用。平台 UI 会改版，入口以实际界面为准。

## 9. Cloudflare Pages 部署主路线

详见 `references/platforms.md`。核心步骤：注册 → 邮箱验证（验证信可能进垃圾箱）→ Workers 和 Pages → 创建 → 直接上传 → 拖 zip → 得 `https://项目名.pages.dev`。更新站点：项目页 → 创建新部署 → 拖新 zip，**网址不变**。

## 10. 部署后验证清单

```
□ curl 批量检查所有资源 HTTP 200（首页/CSS/JS/PDF/每张图）
□ grep 首页内容确认部署的是新版（搜用户姓名或 data.json 里的标志性字段）
□ 浏览器实测：4 页签切换、图片 0 破图、外链 href 正确、控制台无报错
□ 移动端：无横向溢出（scrollWidth ≤ innerWidth）、汉堡菜单可用
□ 手机微信打开一遍（简历链接最真实的查看环境）：下载按钮会显示「微信内长按保存」提示，验证其出现且不阻塞浏览
```

## 11. 常见问题速查

| 现象 | 原因与解法 |
|---|---|
| 改了文件刷新没变化 | 本地/CDN 缓存 → 本地服务器加 no-cache 头；线上等 CDN 刷新或强刷 Ctrl+F5 |
| 上传报「文件名包含非法字符」 | Windows zip 的 `\` 分隔符 → 用 scripts/pack.mjs 重打 |
| Netlify 打开要密码 | 未认领匿名站的临时门 → Claim 注册后自动解除，密码就是页面上印的那个 |
| 平台上找不到「创建项目」入口 | 进的是主控制台不是 Pages 专区 → 见 references/platforms.md，或以平台实际 UI 为准 |
| 手写体标题显示成了普通字体 | Caveat woff2 未随包带上 → 确认 assets/caveat-latin*.woff2 已打包 |
| 微信里点「下载简历」没反应 | 微信内置浏览器不支持下载 → 页面已有长按保存提示；也可复制链接到浏览器下载 |
| 手机号/邮箱怕被爬虫收割 | 可选：HTML 实体编码或 JS 拼接输出联系方式，但务必保持 tel:/mailto: 链接可用 |
| 求职场景要不要自定义域名 | 不必须：默认域名免费+HTTPS，HR 只点链接；自定义域名国内需 ICP 备案 1-3 周 |
