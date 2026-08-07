# 工作台 — AI 分析结果流式呈现

日期：2026-08-07  
状态：已实现  

参照：`src/工作台—AI分析结果.md`  
承接：`docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md`（浮窗壳）  
后端：`ly-innovation-challenge-svc` — `POST /qoderSessions/conversation`（SSE）

## 目标

在分析工具浮窗**左栏**对接文件分析对话接口：点击「一键分析」将当前选中文件全文提交，以 SSE 流式累加正文，并用现有 `MarkdownPreview` 实时渲染（ChatGPT 式随 chunk 更新）。

### 成功标准

1. 已选中且有内容时，点「一键分析」发起 `POST /qoderSessions/conversation`，左栏 Markdown 随 `content` 增量增长，直至 `status === 'STOP'`
2. 复用 `MarkdownPreview`；无前端逐字打字机动画
3. 进行中再次点击：Abort 当前流；若已有 `sessionId` 则调用 cancel；清空左栏后重新发起
4. 关闭浮窗：同上中断并清空；再开为干净空态
5. （本切片）右栏关系图谱占位，不消费 `renderCode` — 右栏图谱消费已在后续切片 `2026-08-07-analysis-panel-relation-graph-design.md` 落地
6. 流式请求封装在 `src/apis`；cancel 走现有 `request`；页面不直调 axios/fetch

## 非目标

- （本切片）右栏关系图谱渲染与 `renderCode` 消费 — 已由 relation-graph 切片完成
- 分析结果记忆 / 打开回填
- 多文件批量分析
- 修改后端契约或提示词
- 扩展 axios `request` 基础设施以通用支持 SSE

## 背景

浮窗壳已落地（`AnalysisPanel`），左栏仍为占位，「一键分析」仅 `message.info`。svc 已提供自动建 Session 的 SSE 对话：入参 `fileName` + `fileContent`，出参事件 data 为 `SseResponse`（`sessionId` / `content` / `renderCode` / `eventId` / `status`），不用 `WebResponse` 包装。工作台已有可复用 `MarkdownPreview`。

## 决策

采用 **浮窗内聚（方案 1）**：`Workbench` 只传入文件名与内容；流式状态与 Abort 生命周期留在 `AnalysisPanel` + `useAnalysisStream`。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 本轮范围 | 仅左栏预览渲染 | 与需求「处理界限」一致；本切片右栏占位（图谱见 relation-graph design） |
| 流式观感 | chunk 累加 + 实时 Markdown | 非前端打字机；非结束后再渲染 |
| 重分析 | Abort + cancel + 清空重开 | 后端已有 cancel |
| 关窗 | Abort 同步 + cancel 非阻塞 | Abort/清状态立即完成；cancel fire-and-forget，不 await 后再关窗 |
| SSE 客户端 | `@microsoft/fetch-event-source` | POST + SSE + Abort 成熟；仅 conversation 开流式例外 |
| cancel | 标准 `request` + `WebResponse` | 与现有 apis 规范一致 |
| 状态归属 | 面板内 hook | 避免污染 Workbench；关窗卸载即收尾 |
| `renderCode` | 忽略（本切片） | 已由 `2026-08-07-analysis-panel-relation-graph-design.md` 取代：`useAnalysisStream` 缓冲，STOP 后解析渲染 |

## 技术方案

### 页内结构（增量）

```
pages/Workbench/
  index.tsx                      # 增：向 AnalysisPanel 传 fileName / fileContent
  components/AnalysisPanel/
    index.tsx                    # 改：一键分析真实触发；左栏 MarkdownPreview
    types.ts                     # 增：fileName / fileContent props
    index.less                   # 按需：结果区样式（走 css-module-less）

src/hooks/useAnalysisStream/
  index.ts                       # 流式状态与中断
  types.ts                       # AnalysisStreamStatus / UseAnalysisStreamResult

src/apis/qoderSessions/
  conversation/index.ts          # 新建：SSE 流式（fetch-event-source）
  conversation/types.ts          # 新建：入参 / SseResponse 等
  cancel/index.ts                # 新建：POST /qoderSessions/{id}/cancel
```

最小化 / 全屏 / 拖拽几何行为不变。

### 数据流

1. 用户点「一键分析」
2. 若 `fileContent` 为空 → `message.warning`，不请求
3. 若已有进行中任务 → `abortAndCancel()`（AbortSignal + 可选 cancel API）→ 清空 `markdown`
4. 调用 `QoderSessionsConversationApi`，POST body：`{ fileName, fileContent }`
5. 每条 SSE：解析 `SseResponse`；记录 `sessionId`；将非空 `content` 拼到缓冲区；（本切片）忽略 `renderCode` — 现已在 hook 中缓冲，见 relation-graph design
6. `status === 'STOP'` 或流正常结束 → `status = 'idle'`（正文保留，可再点分析）
7. 错误 → `status = 'error'`，保留已生成正文（若有）并提示
8. 关窗 / 卸载 → `abortAndCancel()`：先 `runId++` 使旧回调失效，同步 Abort 并清状态；cancel 异步 best-effort，不阻塞关窗

### API 约定

**Conversation（流式例外）**

- URL：`POST {ApiUrl}/qoderSessions/conversation`
- `Content-Type: application/json`
- `Accept: text/event-stream`（库默认即可）
- Body：`{ fileName?: string; fileContent: string }`
- 事件：Spring `ServerSentEvent`，前端按 SSE `data` JSON 解析为：

```ts
type SseResponse = {
  sessionId?: string
  content?: string
  renderCode?: string | null
  eventId?: string
  status?: string // 'RUNNING' | 'STOP' | ...
}
```

- 回调形态（建议）：`onSession` / `onDelta` / `onDone` / `onError` + `signal: AbortSignal`
- 不使用 `ResponseStructure` / `HttpStatus` 包装（与后端一致）
- baseURL 与普通请求一致：复用 `@/config` 的 `ApiUrl`

**Cancel（标准 request）**

- `POST /qoderSessions/{id}/cancel`
- `request` + `ResponseStructure<boolean>` + `HttpStatus.Success`
- 失败不阻断关窗与重分析（best-effort）

### 组件约定

| 单元 | 职责 | 依赖 |
|------|------|------|
| `Workbench` | 提供 `fileName`（path basename）、`fileContent` | 现有 `selectedPath` / `contentByPath` |
| `AnalysisPanel` | 壳交互 + 触发分析 + 左栏展示 | props + hook + `MarkdownPreview` |
| `useAnalysisStream` | 缓冲、状态机、Abort/cancel 编排 | conversation / cancel API |
| `MarkdownPreview` | 渲染累加后的 markdown 字符串 | 仅 `source`；不感知流式 |
| conversation API | SSE 连接与解析 | `@microsoft/fetch-event-source` |
| cancel API | 取消 turn | `@/utils/request` |

`useRequest`：适用于 cancel 若需独立触发；**conversation 流式不用 `useRequest`**（长连接 + 多回调，由 hook 管理）。

### 交互细节

- **分析按钮：** 位于左栏头图右侧（见 analysis-panel-result-ui design）；进行中可再点（中断重开）；用 `LoadingOutlined` icon 表达 running（勿用 antd `loading`，会拦截 onClick）
- **左栏空态：** 未分析且 `markdown` 为空时显示「点击一键分析，查看 AI 结果」
- **最小化：** 不中断流；还原后可见已累加内容
- **切换选中文件：** 不自动关窗、不自动重跑；再次分析使用当前 props
- **用户 Abort：** 不进入 error 态

### 依赖

- 新增：`@microsoft/fetch-event-source`
- 已有：`MarkdownPreview`、`antd` message、`ApiUrl`

### 错误与边界

| 情况 | 行为 |
|------|------|
| 无文件内容 | warning，不发请求 |
| 网络 / HTTP 非 2xx / SSE 失败 | error 提示；保留已生成正文 |
| JSON 解析失败 | 跳过该帧并 `console.warn`；不中断整次流 |
| cancel 失败 | 不阻断 UI |
| 用户 Abort | 静默结束 running |

## 测试要点

1. 有内容：分析 → 左栏随 chunk 增长 → STOP 后稳定
2. 无内容：仅 warning，无 conversation 请求
3. 进行中再点：旧流中断（含 cancel），清空后新流
4. 进行中关窗：中断；再开为空态
5. 最小化不中断；还原可见内容
6. （本切片验收）右栏占位、不渲染图谱 — 图谱渲染验收见 relation-graph design

## 后续（不在本轮）

- ~~消费 `renderCode` 渲染右栏关系图谱~~（已完成，见 `2026-08-07-analysis-panel-relation-graph-design.md`）
- 分析结果记忆与打开回填
- 流式中显式「停止」按钮（若产品需要；本轮靠重分析/关窗中断）

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 初稿：左栏 SSE + MarkdownPreview；浮窗内聚；fetch-event-source；关窗/重分析 Abort+cancel |
| 2026-08-07 | Task 收尾：左栏 SSE 流式呈现已实现；卸载 cleanup 递增 runId 防陈旧 setState |
| 2026-08-07 | 终审修复：一键分析用 icon 示 running；`abortAndCancel` 同步 Abort + cancel 非阻塞，入口递增 runId |
| 2026-08-07 | 分析按钮位置改为左栏头图右侧（见 analysis-panel-result-ui design） |
| 2026-08-07 | 文档同步：右栏图谱已由 relation-graph 切片实现；本 spec 保留左栏流式切片范围，`renderCode` 决策标注为已被取代 |
| 2026-08-07 | `useAnalysisStream` 迁至 `src/hooks/useAnalysisStream/`（`index.ts` + `types.ts`） |
