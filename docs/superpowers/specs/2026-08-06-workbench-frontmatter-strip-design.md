# 工作台 — Markdown Frontmatter 抽离与元数据条

日期：2026-08-06  
状态：已实现  

承接：`docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md`（其中「frontmatter 原样渲染」的后续项）

## 目标

在 Markdown 预览模式下，将文档头部 YAML frontmatter（`---` … `---`）从正文中抽离，并以**自有风格的轻量元数据信息条**单独渲染；正文只渲染 frontmatter 之后的 Markdown。

### 成功标准

1. 合法 frontmatter：Markdown 模式顶部出现元数据条，正文不再出现 `---` 元数据块
2. 常用字段按固定顺序结构化展示：`name`、`description`、`globs`、`alwaysApply`、`disable-model-invocation`（有则显示、无则跳过）
3. 其余顶层键收入「更多」，默认折叠
4. 无 frontmatter 或 YAML 解析失败：整份 `source` 按普通 Markdown 渲染（与抽离前行为一致）
5. 「原文」模式仍展示完整源文件（含 frontmatter），不做抽离
6. `MarkdownPreview` 对外 API 保持 `{ source: string; className?: string }`
7. `parseFrontmatter` 具备单测；`yarn build` 通过

## 非目标

- 分析链路 / 提示词结构拆分（分析侧继续使用完整文档）
- 原文模式抽离或「仅正文 / 完整文件」切换
- 可编辑 frontmatter
- 按文件类型（Skill vs Rule）切换不同字段集
- 改动 `PreviewPane` 模式语义、扫描、目录树、分析浮窗

## 背景

工作台右侧 `PreviewPane` 已支持 Markdown / 原文双模式；`MarkdownPreview` 为可复用内核。Skill / Rule 等常见对象在文件头带 YAML 元数据；此前预览设计明确「本轮原样进入渲染」。原样渲染时 `---` 块会混在正文里，可读性差，且元数据与手册正文职责不同，需要分区呈现。

## 决策

采用 **方案 2：`parseFrontmatter` + `FrontmatterStrip`，由 `MarkdownPreview` 编排**。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 范围 | 仅 Markdown 预览 | 原文模式保持完整源文件 |
| 结构 | 解析纯函数 + 信息条子组件 + 内核编排 | 可测、可复用、API 不变 |
| 常用字段 | 固定五键 | `name` / `description` / `globs` / `alwaysApply` / `disable-model-invocation` |
| 其余字段 | 「更多」折叠 | 默认收起 |
| 视觉 | 轻量信息条 | 浅底 + 左侧强调线；键标签 mono、值 sans；不抢正文 |
| 解析失败 | 降级不抽离 | 整份当普通 MD |
| YAML 库 | 显式依赖 `js-yaml` | 不手写 YAML 语法；类型用 `@types/js-yaml`（若需要） |
| `PreviewPane` | 不改职责 | 继续把完整 `content` 交给 `MarkdownPreview` / `<pre>` |

未选方案 1（全部塞进单文件）：解析与 UI 难拆测。  
未选方案 3（壳负责拆分）：其它复用 `MarkdownPreview` 的入口不会自动受益。

## 技术方案

### 数据流

```
source (完整 MD)
    │
    ▼
parseFrontmatter(source)
    │
    ├─ 无 / 解析失败 → body = source；不渲染信息条
    │
    └─ 成功 → { matter, body }
              │
              ├─ FrontmatterStrip(matter)
              └─ ReactMarkdown(body)   // 现有插件与样式不变
```

### 落盘（`src/components/MarkdownPreview/`）

```
MarkdownPreview/
  index.tsx              # 编排：parse → Strip? → ReactMarkdown
  index.less             # 现有正文样式
  types.ts               # 既有 Props；可增解析结果类型或放 parse 旁
  parseFrontmatter.ts    # 纯函数
  parseFrontmatter.test.ts
  FrontmatterStrip/
    index.tsx
    index.less
    types.ts
```

### `parseFrontmatter`

- **触发条件**：去掉 BOM 后，可选首部空白，文件以 `---` 行开始，且存在闭合 `---` 行
- **成功**：返回 `{ matter: Record<string, unknown>, body: string }`（`body` 为闭合线之后内容）
- **失败 / 无**：返回 `{ matter: null, body: source }`
- **不触发**：正文中的 `---`（如 hr）、非文件头位置的分隔线
- 解析使用 `js-yaml`（`load`）；捕获异常即走失败分支

### `FrontmatterStrip`

- 仅当 `matter !== null` 时由 `MarkdownPreview` 挂载
- **常用字段**固定顺序，缺省跳过：
  1. `name`
  2. `description`
  3. `globs`
  4. `alwaysApply`
  5. `disable-model-invocation`
- 展示规则：
  - 键：小标签，`--mono`
  - 值：`--sans`；`description` 允许多行
  - 布尔：`true` / `false` 文本
  - `globs` 为数组：各项以逗号 + 空格拼接为单行文本；非数组则按标量字符串展示
- **更多**：其余顶层键；默认折叠；展开后键值行；嵌套/非标量统一用 `JSON.stringify(value)`（`--mono`）展示
- 若常用五键皆无、仅有其它键：仍渲染条，且「更多」**默认展开**，避免空白信息条

### `MarkdownPreview`

- Props 不变：`{ source: string; className?: string }`
- 内部：`const { matter, body } = parseFrontmatter(source)`
- DOM：`FrontmatterStrip`（可选）+ 现有 `ReactMarkdown`（插件与正文样式不变）
- 无 frontmatter 时视觉与行为与抽离前一致

### `PreviewPane`

- Markdown 模式：仍 `<MarkdownPreview source={content} />`
- 原文模式：仍 `<pre>{content}</pre>`（完整文件）
- 不新增模式、不感知 frontmatter

### 视觉约定

- 位置：正文上方，与首段之间小间距
- 形态：浅底 + 左侧强调色竖线；无重阴影大卡片
- 可选小标题「元数据」：`--heading` 小字；不用 `--display`
- 「更多」：文字折叠控件；展开区背景略深以区分
- 颜色：既有 CSS 变量；强调线用独立 accent（偏青一类），避免紫/glow/默认 AI 审美簇

### 依赖

- 新增直接依赖：`js-yaml` + `@types/js-yaml`（若类型不自带）
- 不新增 remark-frontmatter 插件栈（抽离在 React 层完成，便于自定义条带）

### 错误与边界

| 情况 | 行为 |
|------|------|
| 无 frontmatter | 不挂条；整份 MD |
| YAML 语法错误 / 非对象根 | 不抽离；整份 MD |
| 只有开头 `---` 无闭合 | 不抽离 |
| 正文内 `---` | 不影响；仅文件头配对 |

### 测试与验收

- 单测 `parseFrontmatter`：有合法 matter、无 matter、坏 YAML、仅开头 `---`、正文中的 `---`、`globs` 数组、BOM/首部空白
- 手工：打开带 frontmatter 的 Skill/Rule → 条 + 正文；切原文见完整源；无 frontmatter 文件观感不变
- `yarn build` 通过

## 修订记录

- 2026-08-06：初稿；方案 2；预览侧 only；常用五字段 +「更多」；失败降级；轻量信息条。
- 2026-08-06：自检收紧歧义——嵌套值统一 JSON.stringify；仅「更多」时默认展开；`globs` 数组逗号拼接；YAML 库锁定 `js-yaml`。
- 2026-08-06：实现完成；parseFrontmatter 单测 7/7 PASS；yarn build 通过。
