# 工作台 — 字体体系（Typography）

日期：2026-08-05  
状态：已实现  

## 目标

统一 WorkBench 字样：正文/UI 用 Inter，普通标题用 Inter 700，品牌/Hero 用 Space Grotesk 600，代码用 IBM Plex Mono；中文回退 Noto Sans SC。通过 CSS 变量 + skill/rule 约束 AI 与人工改样式时按角色选用，并改现有关键页面。

### 成功标准

1. Google Fonts CDN 加载 Inter（400/600/700）、Space Grotesk（600）、IBM Plex Mono（400）、Noto Sans SC（400/600/700），`display=swap`
2. `:root` 提供 `--sans` / `--heading` / `--display` / `--mono`；全局正文、`h1/h2`、`code` 走对应变量与字重
3. Antd `ConfigProvider.theme.token.fontFamily` 与 `--sans` 对齐
4. 现有关键点按角色改完（见「本轮改点」）
5. 新增 `typography` skill + rule；`css-module-less` 仅交叉引用，不重复大段字样规范
6. 组件 less 禁止写死 `Inter` / `Space Grotesk` / `IBM Plex Mono` / `Noto Sans SC` 字面量，一律 `var(--*)`

## 非目标

- 本轮不换成 `@fontsource` 或 `public/fonts` 自托管（后续增强，变量与角色不变）
- 不引入全局 `.fontDisplay` / `.fontMono` 工具类
- 不扫改 Antd 内部全部字重细节
- 不对中文做字体子集裁剪
- 不改业务逻辑 / API / 路由

## 背景

`src/styles/index.global.less` 已有 `--sans` / `--heading` / `--mono`，但仍是系统字体栈，观感单调。项目已有 `css-module-less` skill + rule 模式，适合用同类方式约定字样角色。

## 决策

采用 **方案 2：角色变量 + 独立 typography skill/rule + Antd token**。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 加载方式 | Google Fonts CDN（先） | 接入快；后续可换 npm / 自托管 |
| 标题默认 | Inter 700（`--heading`） | 普通页面/区块标题 |
| 科技味标题 | Space Grotesk 600（`--display`） | 仅品牌名 / Hero / 明确强调 |
| 中文 | Noto Sans SC（CDN） | 与拉丁字体同链；效果后续再调 |
| 约定载体 | 独立 skill + 短 rule | 对齐 css-module-less；避免塞进一个肥 skill |
| 工具类 | 不做 | 与 CSS Module 习惯一致，用变量即可 |

## 技术方案

### 字体角色

| 角色 | CSS 变量 | 字族栈（示意） | 字重 |
|------|----------|----------------|------|
| UI / 正文 | `--sans` | `Inter, "Noto Sans SC", system-ui, sans-serif` | 400 / 600 |
| 普通标题 | `--heading` | 同 `--sans` | 700 |
| 品牌 / Hero | `--display` | `"Space Grotesk", Inter, "Noto Sans SC", system-ui, sans-serif` | 600 |
| 代码 | `--mono` | `"IBM Plex Mono", ui-monospace, Consolas, monospace` | 400 |

判定规则：

- 默认不写 `font-family` → 继承 `--sans`
- 页面/区块标题 → `--heading` + 700
- 仅品牌名或首页主标题等强调位 → `--display` + 600
- `code` / `pre` / 路径 / 正则展示 → `--mono` + 400

### 基建改动

1. **`index.html`**：`<head>` 增加 Google Fonts preconnect + stylesheet（上述家族与字重）
2. **`src/styles/index.global.less`**
   - 更新 `--sans` / `--heading` / `--mono`，新增 `--display`
   - `:root` 的 `font` 使用 `--sans`
   - `h1, h2`：`font-family: var(--heading)`；`font-weight: 700`（替换当前 500）
   - `code`：保持 `var(--mono)`
3. **`src/main.tsx`**：`ConfigProvider.theme.token.fontFamily` **字面量复制**与 `--sans` 相同的栈（Antd token 不能可靠读取 CSS 变量；两处须保持一致，换字体时同步改）

### 本轮改点

| 位置 | 改法 |
|------|------|
| `Home` `.title` | `font-family: var(--display)`；`font-weight: 600`（现为 700，按 display 角色改为 600） |
| `Home` `.subtitle` / `.meta` / `.cta` | 继承 `--sans`；副标题 400；CTA 可用 600 |
| `WorkbenchHeader` `.title` | 品牌标题改为图片 `fabricNameIcon.png`（不再用 display 字样） |
| `RegexSettings` `.heading` | `font-family: var(--heading)`；`font-weight: 700` |
| `AnalysisPanel` `.title` | `font-family: var(--heading)`；`font-weight: 700` |
| `RawPreview` `.content` | 已用 `--mono`，核对即可 |
| `RawPreview` `.path` | 补 `font-family: var(--mono)`（配合全局 `code` 规则） |
| `WorkbenchLayout` `.title`（若路由仍使用） | `--heading` + 700 |
| `MainLayout` 导航 | 默认 `--sans`，无需特判 |

### Skill / Rule

1. **新建** `.cursor/skills/typography/SKILL.md`  
   - 触发：改 UI/样式、标题、代码字样，或提到字体/字重/Inter/Space Grotesk 等  
   - 内容：四角色表、字重、禁止硬编码字体名、CDN 位置、中文回退、后续可换本地字体的备注  
   - 交叉引用 `css-module-less`（布局归那边，字样归本 skill）

2. **新建** `.cursor/rules/typography.mdc`  
   - `globs: src/**/*.{tsx,jsx,less}`  
   - 短文：编辑样式时读 typography skill；角色 → 变量；禁止硬编码字族

3. **修改** `.cursor/skills/css-module-less/SKILL.md`  
   - 在 CSS 变量相关处加一句：字族/字重见 `typography` skill

## 测试计划

- [ ] 冷加载：DevTools Network 可见 fonts.googleapis / gstatic 请求成功；正文为 Inter，中文为 Noto Sans SC
- [ ] Home 主标题为 Space Grotesk；副标题为 Inter
- [ ] 工作台顶栏品牌为图标 + 标题图 `fabricNameIcon.png`（非文字字样）
- [ ] 正则设置页标题、分析面板标题为 Inter 700
- [ ] RawPreview 路径与正文为 IBM Plex Mono
- [ ] Antd Button / Table 等继承 Inter 栈
- [ ] 断网或屏蔽 fonts 域名时：仍可读（系统回退），无布局崩坏

## 后续增强（非本轮）

- 将 CDN 换为 `@fontsource/*` 或 `public/fonts` + `@font-face`
- 按观感微调 Noto Sans SC 字重或是否保留
- 若需，为 Antd `Typography` 统一 code 样式做更细 token

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-06 | 工作台顶栏品牌标题改为图片 `fabricNameIcon.png`，不再使用 Space Grotesk 文字 |
