# 工作台 — Markdown 文档预览

日期：2026-08-06  
状态：已实现  

参照：`src/工作台预览.md`

## 目标

为知识织物工作台右侧内容区提供**文档预览**：在保留原文字符串预览的同时，增加 Markdown 渲染模式；并沉淀项目内可复用的 `MarkdownPreview`，风格由 WorkBench 自有样式体系控制（后续可接分析流式结果，本轮不接入）。

### 成功标准

1. 内容区垂直布局：顶栏 + 预览区；顶栏左侧为文件 path，右侧可切换「Markdown / 原文」
2. 默认模式为 Markdown；用户可随时切回原文
3. Markdown 呈现为文档预览效果（标题、段落、列表、引用、表格、链接、代码等可读排版）
4. 围栏代码块：深色（黑）背景 + 等宽字体 + 轻量语法高亮；行内 code：浅色背景 `#f0f4f8` + 等宽字体；GFM 任务列表勾选态为绿色（`appearance: none` 自绘，因 disabled 原生框不受 `accent-color` 影响）
5. `MarkdownPreview` 仅依赖 `source: string`，可被其他页面复用
6. frontmatter（`---` 元数据）本轮原样进入渲染，不做剥离或元信息面板

## 非目标

- 分析面板流式响应接入与增量渲染
- YAML frontmatter 剥离 / 元信息单独展示
- Shiki 级语法高亮（作为后续增强后备）
- 改动扫描、白名单、目录树、分析浮窗等既有能力

## 背景

工作台已具备：选项目根 → 白名单扫描 → 左树选文件 → 右栏 `PreviewPane`（Markdown / 原文双模式预览）。Skill / Rule 等工作台常见对象多为 Markdown，需要文档感预览以便快速理解。渲染在**运行时**完成：Markdown 解析为结构化 DOM（React 节点），再由项目 Less 定制视觉；与「先转 HTML 再套样式」的目标观感一致，实现上优先 AST → React，便于安全替换代码块等节点。此前纯文本入口为 `RawPreview`，已并入 `PreviewPane` 原文模式并删除。

## 决策

采用 **壳 + Markdown 内核**（方案 1）。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 结构 | `PreviewPane` + `MarkdownPreview` | 壳管模式与空态；内核可复用 |
| 渲染栈 | `react-markdown` + `remark-gfm` + `rehype-highlight` | GFM 表格等；轻量高亮 |
| 样式 | WorkBench 变量与 Less | `--sans` / `--heading` / `--mono` / `--border`；围栏代码黑底；行内 code `#f0f4f8`；任务列表勾选绿（自绘） |
| 默认模式 | Markdown | 文档感优先；可切原文 |
| 换文件时模式 | 保持用户当前选择 | 不强制重置，避免打断 |
| frontmatter | 原样渲染 | 本轮不做剥离；后续再细调 |
| 高亮增强 | Shiki 后备 | 本轮先 highlight.js 路线，效果不够再换 |
| `RawPreview` | 并入 `PreviewPane` 原文模式 | 避免双入口；工作台改挂 `PreviewPane` |

## 技术方案

### 结构

```
src/components/MarkdownPreview/     # 可复用内核
  index.tsx
  index.less
  types.ts

src/pages/Workbench/components/PreviewPane/   # 工作台壳（已替换 RawPreview）
  index.tsx
  index.less
  types.ts

src/pages/Workbench/index.tsx       # 挂载 PreviewPane
```

`RawPreview` 目录已删除；工作台仅挂 `PreviewPane` 单入口。

### 组件职责

| 单元 | 做什么 | 怎么用 | 依赖 |
|------|--------|--------|------|
| `MarkdownPreview` | MD → 文档 DOM | `<MarkdownPreview source={text} />` | 仅字符串与样式，不碰业务状态 |
| `PreviewPane` | 空态、顶栏、模式切换、原文/`MarkdownPreview` | `<PreviewPane path content />` | props：`path` / `content` |
| `Workbench` | 传选中 path/content | 现有编排不变 | 不感知 Markdown 细节 |

### `MarkdownPreview` 约定

- Props：`{ source: string; className?: string }`
- 插件：`remark-gfm`；`rehype-highlight`
- 样式范围：标题层级、段落、列表、引用、表格、链接、行内 code（`#f0f4f8`）、围栏 pre/code（黑底 + 高亮主题）、任务列表勾选绿
- 未知语言代码块：深色底 + mono，无高亮即可

### `PreviewPane` 交互

| 状态 | UI |
|------|-----|
| `!path \|\| content === null` | 与现一致 Empty（「从左侧选择文件」）；不展示模式切换 |
| 已选中 | 顶栏 path + Segmented（Markdown \| 原文）；下方按模式渲染 |
| `content === ''` | 有顶栏；正文为空 |

模式枚举建议：`'markdown' | 'raw'`，默认 `'markdown'`。

### 数据流

1. 选中文件 → `contentByPath` 取字符串  
2. `PreviewPane` 接收 `path` / `content`  
3. Markdown 模式：`content` → `MarkdownPreview`  
4. 原文模式：`content` → `<pre>`（保持现有可读性：`pre-wrap`、mono）  
5. `mode` 仅存在于 `PreviewPane` 内部，不升到 `Workbench`

### 错误与边界

- 残缺 Markdown：解析器尽力渲染，不弹全局错误  
- 不引入 `dangerouslySetInnerHTML` 作为主路径  

### 依赖

新增：`react-markdown`、`remark-gfm`、`rehype-highlight`（及所选高亮样式按需引入）。版本在实现计划中锁定。

### 测试与验收

- 以手工验收为主：模式切换、常见 MD 元素、围栏代码黑底与高亮、行内 code `#f0f4f8`、任务列表勾选绿、换文件后模式保持  
- 本轮不强制组件单测  

## 后续（不在本轮实现）

- 分析浮窗流式结果复用 `MarkdownPreview`  
- frontmatter 剥离与元信息展示：已由 `2026-08-06-workbench-frontmatter-strip-design.md` 实现（2026-08-06）。  
- 若轻量高亮不够，升级 Shiki  

## 修订记录

- 2026-08-06：任务列表勾选改 `appearance: none` 自绘绿色（`accent-color` 对 disabled 无效仍灰）。
- 2026-08-06：行内 code 定稿 `#f0f4f8`；GFM `[x]` 任务勾选态用 `accent-color: #22c55e`（原生 disabled checkbox 默认灰，非被覆盖）。
- 2026-08-06：行内 `` `code` `` 改为浅色底（`var(--code-bg)` + `--text-h`）；围栏代码块仍黑底。
- 2026-08-06：Task 5 完成 — `tsc`/`yarn build` 冒烟通过；UI 清单已按代码核验（浏览器 File System Access 交互项待人工确认）；状态改为已实现。
- 2026-08-06：Task 4 完成 — `Workbench` 改挂 `PreviewPane`，删除 `RawPreview` 目录。
- 2026-08-06：frontmatter 剥离/元信息条已由独立 spec `2026-08-06-workbench-frontmatter-strip-design.md` 交付（success criteria / 非目标 中「本轮不做」为历史表述）。
