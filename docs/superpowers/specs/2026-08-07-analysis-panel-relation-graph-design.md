# 工作台 — 分析工具右栏关系图谱

日期：2026-08-07  
状态：已实现  

参照：`src/工作台关系图图谱.md`  
承接：

- `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md`（浮窗壳，右栏占位）
- `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`（左栏 SSE；`renderCode` 未消费）
- `docs/superpowers/specs/2026-08-07-analysis-panel-result-ui-design.md`（左栏结果 UI）

后端：`ly-innovation-challenge-svc` — `POST /qoderSessions/conversation`（SSE，`content` + `renderCode`）

## 目标

在分析工具浮窗**右栏**消费 SSE 的 `renderCode`：模型在约定标签内输出**语义图 JSON**，前端用 `@xyflow/react` + `dagre` 渲染可交互关系图谱，帮助用户一眼看清文档关联，并支持点击节点联动工作台选中文件。

### 成功标准

1. 分析结束（`status === 'STOP'` 或流正常结束）后，若 `renderCode` 为合法图 JSON，右栏渲染节点图（含可选短说明）
2. 画布支持缩放/平移；点击节点高亮相邻边与邻居；有可匹配 `path` 时调用工作台选中文件
3. 无图或解析失败时，右栏分别显示「无文件关联结果」或「异常渲染」；左栏 Markdown 不受影响
4. 后端分析提示词改为要求标签内输出本契约图 JSON（不再要求 Mermaid）；标签剥离机制保持不变
5. 重分析 / 关窗清空图谱状态，与现有流式生命周期一致

## 非目标

- 修改 `author-analyze-skill`（元 Skill）或其它解析 Skill 正文约定
- 服务端对图 JSON 做 schema 强校验或规范化改写
- 流式过程中边收边画
- 复杂图工具（多跳筛选、边类型工具栏、全局/聚焦模式、节点编辑）
- 分析结果持久化 / 打开回填
- 复用或依赖其它仓库中的关系图 demo 实现

## 背景

- 浮窗左右分栏已落地；左栏流式 Markdown 已通；右栏仍为「关系图谱（占位）」
- SSE 已有 `renderCode` 字段；服务端用 `<<<LY_FABRIC_RENDER_START>>>` … `<<<LY_FABRIC_RENDER_END>>>` 从模型输出中分离渲染块，正文进 `content`，块内进 `renderCode`
- 当前后端提示词文案仍写「Mermaid」，示例片段与目标契约不一致；本轮以**适合前端 xyflow 消费的语义 JSON**为准，回改提示词
- 左栏文字版「文件关系」继续保留（由现有解析 Skill / 分析正文负责）；图谱为可视化补充

## 决策

采用 **通道复用 + 轻量图组件（方案 1）**：

| 决策点 | 选择 | 说明 |
|--------|------|------|
| LLM 产出 | 语义图 JSON（非可执行代码、非 Mermaid） | 渲染效果由前端固定掌控 |
| 传输 | 现有 RENDER 标签 → `renderCode` | 不新开接口 |
| 渲染库 | `@xyflow/react` + `dagre` | JSON → Node/Edge；布局前端算坐标 |
| 渲染时机 | 仅 STOP / 流正常结束 | 进行中不解析半成品 |
| 交互 | 缩放平移 + 点击高亮邻居 + 可选选中文件 | 不做复杂图工具 |
| 元 Skill | 不改 | 图契约只写在后端分析提示词 |
| 服务端校验 | 不强制 | 坏数据前端降级文案 |

## 技术方案

### 图 JSON 契约（线格式）

LLM **不**直接输出 xyflow 的 `Node`/`Edge`（不含 `position`、不含 UI 组件字段）。线格式如下；前端映射后再用 `dagre` 写入坐标。

```json
{
  "version": "1.0",
  "title": "可选，右栏小标题",
  "nodes": [
    {
      "id": "n1",
      "label": "展示名",
      "path": "可选，工作台相对路径",
      "summary": "可选，一句短说明（节点副文案）"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "label": "可选，边上短关系词"
    }
  ]
}
```

| 字段 | 约束 |
|------|------|
| `version` | 建议 `"1.0"` |
| `title` | 可选 |
| `nodes` / `edges` | 必填数组 |
| `nodes[].id` / `label` | 必填 |
| `nodes[].path` / `summary` | 可选；`summary` 宜短（提示词可约束约 20 字内） |
| `edges[].id` / `source` / `target` | 必填；`source`/`target` 为 node id |
| `edges[].label` | 可选；宜短 |

**展示：** 节点主行 `label`，副行 `summary`（无则不显示）；边显示 `label`（有则）；有 `title` 时右栏顶部可显示。

**刻意不包含（首版）：** `rootPath`、`isRoot`、`layout`、`kind`、`direction`、复杂 `type` 色板、长描述字段。

### 传输

模型输出形态：

```text
（分析正文 Markdown…）

<<<LY_FABRIC_RENDER_START>>>
{ ...graph json... }
<<<LY_FABRIC_RENDER_END>>>
```

- 标签外禁止再出现图 JSON / Mermaid
- 标签内禁止解释性自然语言
- 服务端剥离逻辑保持不变；`renderCode` 语义定为「图 JSON 字符串」

### 前端结构

```
pages/Workbench/
  index.tsx                         # 增：向 AnalysisPanel 传 onSelectFile
  components/AnalysisPanel/
    index.tsx                       # 右栏接 RelationGraph
    RelationGraph/
      index.tsx                     # xyflow 画布
      types.ts                      # GraphJson 类型
      parseGraphJson.ts             # 解析与校验
      toFlowElements.ts             # → xyflow 元素 + dagre
      index.less
src/hooks/useAnalysisStream/
  index.ts                          # 增：缓冲 renderCode；STOP 后供解析
  types.ts
src/apis/qoderSessions/conversation/
  index.ts                          # 若需：把 renderCode 交给 handlers
  types.ts                          # handlers 增 onRenderCode 或等价
```

依赖新增：`@xyflow/react`、`dagre`（及必要的类型包）。

### 数据流

1. 用户一键分析（既有左栏流程不变）
2. SSE：非空 `content` 累加 Markdown；非空 `renderCode` **覆盖缓冲**（以最后一次为准）
3. `STOP` / 流正常结束 → `parseGraphJson(缓冲)`
4. 成功 → `RelationGraph` 渲染；失败/空 → 右栏固定文案（见下）
5. 重分析 / 关窗：清空 markdown 与 graph 缓冲（与现 Abort/cancel 一致）

进行中右栏不展示半成品图，可保持简短占位（如「关系图谱将在分析完成后显示」）；**结束后**的空/错只用下列两句。

### 右栏结束态文案

| 情况 | 右栏文案 |
|------|----------|
| 无 `renderCode` 或解析后无有效节点 | 无文件关联结果 |
| JSON 非法或校验失败 | 异常渲染 |

### 交互细节

| 能力 | 行为 |
|------|------|
| 布局 | 前端 `dagre` 自动布局 |
| 画布 | 缩放、平移；可保留基础 Controls；不可编辑图结构 |
| 点击节点 | 高亮该节点及相邻边/邻居；若存在 `path` 则尝试选中工作台文件 |
| 路径匹配 | 与已扫描路径精确匹配优先；再试规范化（`\`→`/`、去 `./`）；仍失败则只高亮、不切换选中（可选轻提示） |
| 坏边 | 丢弃 `source`/`target` 指向不存在节点的边，仍渲染其余有效部分 |

`AnalysisPanel` 新增 `onSelectFile: (path: string) => void`，由 `Workbench` 传入现有选中逻辑。

### 后端改动

文件：`QoderSessionServiceImpl` 中 `ANALYSIS_PROMPT_TEMPLATE`（及 Controller 描述文案）

- 删除「输出 Mermaid」要求
- 改为：分析完成后在 RENDER 标签内输出**一份**符合本契约的图 JSON
- 提示词内附精简字段说明 + 合法示例（与上表一致）
- **不改**分离器、SSE 帧结构、cancel、会话创建

### 组件约定

| 单元 | 职责 |
|------|------|
| `useAnalysisStream` | 缓冲 `renderCode`；生命周期与 markdown 一并清空 |
| `parseGraphJson` | `JSON.parse` + 必填字段校验；返回成功载荷或失败 |
| `toFlowElements` | 语义图 → xyflow nodes/edges + dagre positions |
| `RelationGraph` | 展示、高亮、点击回调；不发起网络请求 |
| `AnalysisPanel` | 右栏状态机（进行中占位 / 图 / 两句结束文案） |
| `Workbench` | 提供 `onSelectFile` |

### 错误与边界

| 情况 | 行为 |
|------|------|
| 进行中 | 右栏不解析画图 |
| STOP 无图 | 「无文件关联结果」 |
| STOP 解析失败 | 「异常渲染」 |
| 左栏 | 始终按既有 Markdown 流展示，不因图谱失败而清空 |
| 用户 Abort | 不进入图谱错误态；缓冲清空或保持与现流式 Abort 一致（实现与 markdown 清空对齐） |

## 测试要点

1. 合法 `renderCode`：STOP 后右栏出图；节点可见 `label`，有则可见 `summary`；边可见短 `label`
2. 点击节点：邻居与边高亮；`path` 命中时目录/预览切换到对应文件
3. `path` 无法匹配：仅高亮，不错误中断左栏
4. 空 / 非法 `renderCode`：右栏分别为「无文件关联结果」/「异常渲染」；左栏可读
5. 重分析、关窗后再开：图谱与正文均为干净状态
6. 后端提示词变更后，标签内为 JSON 而非 Mermaid；标签外无渲染块

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 初稿：语义图 JSON + xyflow/dagre；复用 RENDER→renderCode；STOP 渲染；点击高亮+选文件；后端改提示词；不改元 Skill；空/错文案两句定稿 |
| 2026-08-07 | 实现落地（右栏图谱 + 后端提示词） |
| 2026-08-07 | `useAnalysisStream` 迁至 `src/hooks/useAnalysisStream/` |
