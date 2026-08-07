# 工作台 — 分析工具默认尺寸与左栏结果 UI

日期：2026-08-07  
状态：已实现  

承接：

- `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md`（浮窗壳）
- `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`（左栏流式 Markdown）

参照：用户提供的「AI 分析结果」参考图（头图 + 浅灰卡片 + 重新分析）

## 目标

放大分析工具浮窗的**默认打开尺寸**，并按参考图调整**左栏分析结果区**视觉结构：独立头图、状态副标题、浅灰结果卡片；将「一键分析 / 重新分析」从窗体标题栏移到左栏头图右侧。

### 成功标准

1. 默认打开几何为 **1180×760**（小屏仍按 `viewport − 32` 夹紧）；水平居中、垂直约 1/3 处不变
2. 窗体标题栏仅保留：最小化、全屏/退出全屏、关闭；**不再**放置分析按钮
3. 左栏顶部：闪电图标 +「AI 分析结果」+ 状态副标题；右侧为分析按钮
4. 分析按钮文案：`idle` 且无正文 →「一键分析」；有正文或 `running` →「重新分析」；`running` 用 `LoadingOutlined` 示意（不用 antd `loading`）
5. 正文落在浅灰圆角卡片内：有 `markdown` 时用现有 `MarkdownPreview`；无正文时卡片内空态
6. 流式 Abort / cancel / 关窗清空等行为与现网一致，不改 SSE 契约

## 非目标

- 右栏关系图谱实现或「问题链路分析」区块
- 修改 `MarkdownPreview` 全局样式或增加 variant
- 抽出独立 `AnalysisResultPane` 包（本轮 in-place）
- 改变默认过小阈值（仍为 480×320）
- 持久化窗口几何

## 决策

采用 **AnalysisPanel 内联改造（方案 1）**：只改 `panelGeometry` 默认常量与左栏 JSX/Less；继续复用 `MarkdownPreview` 与 `useAnalysisStream`。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 默认尺寸 | 1180×760 | 明显大于 960×640，仍可拖；非视口铺满 |
| 左栏结构 | 头图 + 状态副标题 + 浅灰卡片 | 对齐参考，不拆整页壳 |
| 分析按钮位置 | 左栏头图右 | 标题栏只留窗控三钮 |
| 按钮文案 | 一键分析 / 重新分析 随状态 | 有正文或 running 用「重新分析」 |
| 副标题 | 随 `status` + 是否有正文 | 见下表 |
| Markdown | 复用现组件，不加 variant | 避免波及原文预览 |

### 副标题文案

| 条件 | 副标题 |
|------|--------|
| `idle` 且无正文 | 点击一键分析，查看 AI 结果 |
| `running` | 正在根据当前文件生成解读与建议… |
| `idle` 且有正文 | 已根据当前文件内容生成本次解读与建议。 |
| `error` | 分析中断或失败，可修改后重新分析 |

## 技术方案

### 触及文件

```
pages/Workbench/components/AnalysisPanel/
  panelGeometry.ts   # DEFAULT_PANEL_WIDTH/HEIGHT → 1180 / 760
  resultChrome.ts    # 副标题 / 按钮文案纯函数
  index.tsx          # 标题栏去分析钮；左栏头图 + 按钮 + 卡片
  index.less         # 头图、副标题、结果卡片样式（css-module-less）
```

既有浮窗壳 / 流式 design 中「默认 960×640」「标题栏一键分析」表述已同步修订（见各文修订记录）。

### 左栏结构（示意）

```
.pane (左)
  .resultHeader
    .resultBrand (图标 + 标题 + 副标题)
    Button（一键分析 / 重新分析）
  .errorBar?（既有）
  .resultCard
    MarkdownPreview | 空态文案
```

### 交互

- 分析触发逻辑不变：无内容 warning；进行中再点 → Abort + cancel + 清空重开
- 左栏按钮区 `onMouseDown` stopPropagation，避免抢拖拽手柄
- 拖拽手柄仍为窗体 `.header`
- 最小化 / 全屏 / 关闭行为不变

### 样式约定

- CSS Modules + 同级 `index.less`
- 颜色优先 `var(--accent)` / `var(--text)` / `var(--text-h)` / `var(--border)`；卡片底可用浅灰（如 `color-mix` 或与参考接近的中性灰），避免写死无关品牌色
- 字族：`var(--heading)` 标题、`var(--sans)` 正文；图标用 antd `ThunderboltOutlined`（或等价）
- **高度链：** `react-rnd` 根用 `.rnd`，内层 `.panel` 设 `width/height: 100%` + column flex，保证 `.body` 撑满浮窗；左栏 `.paneResult` 用 `min-height: 0` + `overflow: hidden`，滚动落在 `.resultCard`

## 测试要点

1. 打开浮窗：默认约 1180×760（大屏）；标题栏无「一键分析」
2. 左栏可见头图、副标题（空态文案）、浅灰卡片与「一键分析」
3. 有内容分析：副标题变「正在…」→ 完成后「已根据…」；按钮变「重新分析」；Markdown 在卡片内增长
4. 进行中再点「重新分析」：中断并重开
5. 最小化 / 全屏 / 关闭行为与现网一致；关窗后再开为空态且默认几何
6. 右栏仍为图谱占位

## 后续（不在本轮）

- 右栏图谱 / 问题链路分析入口
- Markdown 分析态排版微调（若产品需要更贴参考）

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 初稿：默认 1180×760；左栏头图+状态副标题+浅灰卡片；分析按钮迁至左栏并区分一键/重新分析 |
| 2026-08-07 | Task 收尾：默认 1180×760 与左栏 UI 已落地 |
| 2026-08-07 | 修复：rnd 内层 panel 拉满高度，body/左栏结果区撑满浮窗 |
