# fabric 首页落地页改版设计

日期：2026-08-04  
状态：已实现  
参考：OpenAI ChatGPT Images 2.0 公告页气质（白底、居中 Hero、黑胶囊 CTA、圆角媒体区）

## 目标

将 WorkBench 首页（`/`）从 Vite 脚手架演示页，改成接近参考站的产品落地页；同步调整 `MainLayout` 顶栏，去掉登录/搜索，右侧仅保留进入工作台的 CTA。

### 成功标准

1. `/` 展示：元信息「产品 · 工作台」→ 标题「欢迎使用 fabric」→ 副标题「本地扫描 · 白名单匹配 · 原文预览」→ 黑胶囊 CTA → 圆角空媒体区
2. 顶栏：左侧 Logo +「首页 / 工作台 / 正则设置」；右侧「进入工作台」黑胶囊；无登录、无搜索
3. 顶栏 CTA 与 Hero CTA 均导航至 `/workbench`
4. 首页不再包含计数器、请求示例、文档/社区链接等演示内容
5. 桌面与窄屏均可阅读：标题与间距在小屏缩小，导航仍靠左

## 非目标

- 不实现登录、搜索、用户菜单
- 媒体区本轮不嵌入视频或图片（仅留空占位）
- 不改路由表结构、不改 `/workbench` / `/regex-settings` 业务页
- 不引入新字体包 / CDN；不抽文案配置系统
- 不统一改造全局 dark mode 策略（沿用现有 CSS 变量即可）

## 背景

当前 `src/pages/Home` 仍为 Vite + React 欢迎页与 `ReportEventCategoryApi` 请求示例；`MainLayout` 为简单左对齐链接条，缺少参考页式的主 CTA。产品需要更清晰的入口叙事：首页介绍能力，一键进入工作台。

## 决策

采用 **方案 A（完整参考页结构）+ 导航靠左修订**：

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 布局方案 | A | Hero 居中 + 空媒体区，贴近参考页 |
| 导航对齐 | 靠左 | Logo 与「首页 / 工作台 / 正则设置」同一左侧簇；非居中导航 |
| 主 CTA 目标 | `/workbench` | 顶栏与 Hero 一致 |
| 文案 | 标题 B + 副标题 A | 「欢迎使用 fabric」+「本地扫描 · 白名单匹配 · 原文预览」 |
| 演示内容 | 整页替换 | 去掉 Vite 演示与请求示例 |
| 媒体区 | 留空 | 浅灰底 + 圆角容器，无内容 |

## 技术方案

### 改动文件

| 文件 | 变更 |
|------|------|
| `src/layouts/MainLayout/index.tsx` | 左：Logo + 三导航；右：CTA Link |
| `src/layouts/MainLayout/index.less` | 顶栏 `space-between`；CTA pill 样式 |
| `src/pages/Home/index.tsx` | 重写为落地页结构；移除演示逻辑与无关 import |
| `src/pages/Home/index.less` | Hero / 元信息 / CTA / 媒体占位样式；删除旧演示样式 |

### 结构

```text
MainLayout
├── nav
│   ├── left: Link(logo) + Link(首页) + Link(工作台) + Link(正则设置)
│   └── right: Link CTA「进入工作台」→ /workbench
└── main → Outlet
    └── Home（仅 /）
        ├── meta「产品 · 工作台」
        ├── h1「欢迎使用 fabric」
        ├── p 副标题
        ├── Link CTA「进入工作台」→ /workbench
        └── div.mediaPlaceholder（空，16:9，圆角）
```

### 视觉规格

- 背景白、正文近黑、元信息灰色（约 `#8a8a8a`）
- CTA：黑底白字、`border-radius: 999px`，可带右上箭头字符或简易 SVG
- 媒体区：最大宽约 960px、圆角约 16px、宽高比 16:9、浅灰底；可虚线边表示占位，内部无媒体
- 字体：沿用 `index.global.less` 的 `--sans` / `--heading`
- 动效：链接与按钮 hover 轻微透明度即可
- 窄屏（建议 ≤768px）：缩小 h1 / 副标题字号与上下 padding；顶栏可换行或略缩 gap，仍左导航 + 右 CTA

### 路由与依赖

- 路由表不变：`/` → Home（MainLayout）；`/workbench`、`/regex-settings` 保持现有
- Home 不再依赖 `ReportEventCategoryApi`、`ahooks` useRequest、`@/assets/hero.png`、react/vite logo（若无他处引用，本轮不强制删除静态资源文件）

## 测试要点

1. 打开 `/`：文案、CTA、空媒体区符合上文；无演示区块
2. 顶栏三链接与右侧 CTA 跳转正确；无登录/搜索控件
3. Hero CTA 进入 `/workbench` 且业务页可用
4. 缩小视口：布局不严重溢出，CTA 仍可点

## 实现备注

实现前按 `writing-plans` 产出 plan；实现后若有 design/plan 偏差，按仓库 `sync-design-plan` 约定回写。

## 修订记录

- 2026-08-04：已按方案 A（导航靠左）实现 MainLayout + Home 落地页
- 2026-08-04：Home 样式微调 — CTA 增加 `:focus-visible`；元信息/媒体区改用全局 CSS 变量以适配 dark mode
- 2026-08-04：MainLayout 导航 hover 限定到 `.navLeft a`，顶栏 CTA 补 `:focus-visible` 并去掉 `!important`
