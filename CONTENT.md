# 模板使用指南：只换文字，不动风格

`template/` 目录是一套**开箱即用且可直接运行**的简历站模板：版式、配色、动效、字体、响应式全部内置，
换一份简历 = 替换占位符 + 换图片/PDF，**不需要改任何 CSS 和交互逻辑**。

## 目录结构（template/ 即部署结构，替换后可直接打包）

```
你的站点/
├── index.html          ← 模板版，替换 {{占位符}} 后即用
└── assets/
    ├── style.css       ← 风格层，无需修改（改配色只动 :root 变量）
    ├── site.js         ← 交互层，无需修改（自动识别微信并显示下载提示）
    ├── caveat-latin.woff2 / caveat-latin-ext.woff2  ← 手写体字体，无需修改
    ├── resume.pdf      ← 占位 PDF → 换成真实简历（英文文件名）
    ├── og.png          ← 分享卡片图（可选，1200x630）
    └── work/           ← 项目示意图（占位图 → 换成真实截图）
        ├── project1-cut.png
        └── ...
```

## 推荐替换方式：data.json + 脚本（免手工搜替）

1. 复制 `scripts/data.example.json` 为 `data.json`，填入真实内容
2. `node scripts/replace.mjs --data data.json --target index.html`
3. `node scripts/check.mjs .` 自检（残留占位符 / 引用文件 / 非英文文件名）

手工替换也可以，但完成后**必须**全文搜 `{{` 确认无遗漏，并跑 check.mjs。

## 一、必填占位符（个人信息）

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{CN_NAME}}` | 姓名 | 张三 |
| `{{EN_GREETING}}` | 首页英文问候 | Hello, I'm San. |
| `{{JOB_TITLE}}` | 职位（页面标题用） | 产品运营 |
| `{{META_DESC}}` | 搜索/分享描述 | 张三 · 产品运营 个人简历 |
| `{{OG_IMG}}` | 分享卡片图文件名（assets/ 下，1200x630） | og.png |
| `{{TAGLINE}}` | 首页一句话标签 | 5 年产品运营 · 现居上海 |
| `{{INTRO}}` | 首页简介（1-2 句亮点） | 擅长…；具备… |
| `{{PHONE}}` | 手机号（同时用于 tel: 链接） | 13800000000 |
| `{{EMAIL}}` | 邮箱（出现 2 处：联系方式 + 侧边栏） | zhangsan@mail.com |
| `{{JOB_INTENT}}` | 求职意向 | 产品运营 |
| `{{PDF_FILE}}` | 简历 PDF 文件名（HTML 内 2 处） | resume.pdf |

## 二、导航文案（4 处 × 2 侧同步）

| 占位符 | 默认 | 说明 |
|---|---|---|
| `{{NAV2}}` `{{NAV3}}` `{{NAV4}}` | 业务模块 / 项目经历 / 技能与教育 | 顶栏和侧栏各出现一次，两处必须一致 |

## 三、首页动画区（定制区）

- `{{LIVE_TITLE}}`：中心卡片标题（建议改成与职业相关的招牌项目名）
- `{{CHIP1~5_TXT}}`：5 枚气泡文字（填最有代表性的 5 个项目/关键词；只改文字别动结构，气泡不够 5 个就删除多余的 `.chip` 块并同步删 style.css 对应 `.chip-xxx` 定位）
- `{{STATE1~5_WORD}}` + `{{STATE1~5_EXTRA}}`：状态胶囊 5 组轮播（状态词 + 右侧补充信息，每组展示 5 秒）

## 四、业务模块页（2 张模块卡，可增删）

- 页头：`{{WORK_HEAD_EN}}`（英文手写体装饰，如 My Work）、`{{WORK_TITLE}}`
- 卡片 1：`{{MOD1_BADGE}}`（角标字，如 运营）、`{{MOD1_NAME}}`、`{{MOD1_SUB}}`（如「6.8 年 · 某公司 / 某公司」）
- 经历条目：`{{MOD1_J1_TITLE}}`（项目名）、`{{MOD1_J1_PERIOD}}`（公司 · 时间段）、`{{MOD1_J1_C1~C3}}`（成果要点，每条尽量带数字）
- 规则：**一段经历 = 一个 `.work-item` 块**，可复制增删；整个模块卡 2 不需要就整块删除

## 五、项目经历页（6 张时间轴卡，可增删）

每张卡：`{{P1_CO}}`（公司）、`{{P1_TIME}}`（时间段）、`{{P1_ROLE}}`（职位）、`{{P1_TITLE}}`（项目名）、`{{P1_LI1~LI3}}`（要点）、图片相关 4 项。

图片三种样式（详见 index.html 内注释）：

| 样式 | 类名 | 适用 |
|---|---|---|
| 透明底抠图 | `tl-media` | 彩色背景 UI 截图（推荐抠图后使用） |
| 白底长图裁顶 | `tl-media--tall` | 纯白底截图（与白卡天然融合） |
| 横版小缩略 | `tl-media--thumb` | 官网横版截图（保留文字） |

- 有图有链接：`<a class="tl-media" href="{{P1_LINK}}">`；有图无链接：`<figure class="tl-media">`
- 无图：删除整个 media 块，卡片自动变窄
- 图片命名建议英文：`project1-cut.png`；`{{P1_IMG_ALT}}` 填图片描述（无障碍）
- data.json 里 `P*_IMG` 的文件名必须与 `assets/work/` 实际文件一致（check.mjs 会校验）

## 六、技能与教育页

- 硬技能：`{{SKILL1~7_NAME}}` + `{{SKILL1~7_PCT}}`（条数可增删）
- 软技能：`{{SOFT1~6}}`（图标是通用线框，可原样保留；`{{HARD_TITLE}}`/`{{SOFT_TITLE}}` 默认「硬技能/软技能」）
- 教育：`{{EDU_SCHOOL}}`、`{{EDU_TIME}}`、`{{EDU_DEGREE}}`、`{{EDU_EXTRA}}`（语言/荣誉等补充行）

## 七、模板内硬编码文案（不在占位符体系内，换语言/改文案时注意）

| 位置 | 当前文案 |
|---|---|
| `<html lang>` | `zh-CN` |
| 顶栏/侧栏第一项 | 首页 |
| 下载按钮 | 下载简历 |
| 微信下载提示（#dlHint） | 微信内无法直接下载，请长按打开 PDF 后保存… |
| 技能区英文装饰 | Hard Skills / Soft Skills / Education |
| 页脚 aria-label | 翻到下一页 |

这些文案中英文环境通用场景下保持默认即可；面向纯英文求职环境时需手动改掉。

## 八、图片处理（可选，透明底抠图）

彩色背景截图想做成「主体贴卡」效果 → 见 `references/cutout.md`。
速记：jimp 纯 JS；**白底图不要抠**（贴白卡天然融合，且图内白色元素会消失）。

## 九、风格微调（可选）

只动 `style.css` 的 `:root` 变量即可整体换肤：

```css
--accent: #2B7FD8;   /* 强调色：换成个人品牌色 */
--yellow: #FFD84D;   /* 马克笔黄：装饰线颜色 */
--bg: #FEFCF6;       /* 页面底色 */
```

## 十、替换完成后

1. `node scripts/check.mjs .` —— 全部 ✓ 后再继续
2. 本地打开 index.html 自检四页 + 手机宽度
3. `node scripts/pack.mjs . -o site.zip` 打包 → 按 SKILL.md 第 8-10 节部署与验证
