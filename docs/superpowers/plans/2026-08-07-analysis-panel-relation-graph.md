# 分析工具右栏关系图谱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 分析浮窗右栏在 STOP 后消费 `renderCode` 语义图 JSON，用 `@xyflow/react` + `dagre` 渲染关系图谱，并支持点击高亮邻居与联动选中工作台文件；后端分析提示词改为约定该 JSON。

**Architecture:** SSE 继续剥离 `<<<LY_FABRIC_RENDER_*>>>` 进 `renderCode`；`useAnalysisStream` 覆盖缓冲 `renderCode`，仅在结束时解析；`RelationGraph` 负责校验→布局→画布→点击；`Workbench` 传入 `onSelectFile` 与已知路径列表做匹配。后端只改 `ANALYSIS_PROMPT_TEMPLATE` 与文档描述，不改分离器。不改元 Skill。

**Tech Stack:** React 19、`@xyflow/react`、`dagre`、Less CSS Modules、Vitest、现有 `@microsoft/fetch-event-source` SSE、Spring 提示词字符串

**Spec:** `docs/superpowers/specs/2026-08-07-analysis-panel-relation-graph-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。跨仓库：WorkBench + `ly-innovation-challenge-svc`。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加 `@xyflow/react`、`dagre`、`@types/dagre` |
| `src/apis/qoderSessions/conversation/types.ts` | handlers 增 `onRenderCode` |
| `src/apis/qoderSessions/conversation/index.ts` | SSE 帧把非空 `renderCode` 交给回调 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/types.ts` | 线格式 `GraphJson` 等 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.ts` | 解析校验 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.test.ts` | 解析单测 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.ts` | 路径匹配 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.test.ts` | 匹配单测 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/toFlowElements.ts` | → xyflow + dagre |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/index.tsx` | 画布组件 |
| `src/pages/Workbench/components/AnalysisPanel/RelationGraph/index.less` | 节点/画布样式 |
| `src/hooks/useAnalysisStream/index.ts` | 缓冲 `renderCode`；导出终态 |
| `src/hooks/useAnalysisStream/types.ts` | 流式状态相关类型 |
| `src/pages/Workbench/components/AnalysisPanel/types.ts` | `onSelectFile` / `knownPaths` |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 右栏接图谱 / 两句文案 |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 右栏 pane 样式（按需） |
| `src/pages/Workbench/index.tsx` | 传入 `onSelectFile`、`knownPaths` |
| `ly-innovation-challenge-svc/.../QoderSessionServiceImpl.java` | 提示词改图 JSON |
| `ly-innovation-challenge-svc/.../QoderSessionController.java` | Swagger 描述同步 |
| `docs/superpowers/specs/2026-08-07-analysis-panel-relation-graph-design.md` | 收尾：状态 → 已实现 |
| `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md` | 同步：右栏已消费 `renderCode` |

---

### Task 1: 安装图库依赖

**Files:**
- Modify: `package.json`（由包管理器写入）

- [x] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
yarn add @xyflow/react dagre
yarn add -D @types/dagre
```

Expected: `dependencies` 出现 `@xyflow/react`、`dagre`；`devDependencies` 出现 `@types/dagre`；安装无报错。

- [x] **Step 2: 确认可解析**

```powershell
yarn why @xyflow/react
yarn why dagre
```

Expected: 显示已安装版本信息。

---

### Task 2: 图 JSON 解析纯函数 + 单测

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/types.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.test.ts`

- [x] **Step 1: 写失败单测**

创建 `parseGraphJson.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { parseGraphJson } from './parseGraphJson';

describe('parseGraphJson', () => {
  it('parses valid graph json', () => {
    const raw = JSON.stringify({
      version: '1.0',
      title: '依赖',
      nodes: [
        { id: 'a', label: 'A', path: 'docs/a.md', summary: '说明' },
        { id: 'b', label: 'B' },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', label: '引用' }],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.nodes).toHaveLength(2);
    expect(result.graph.edges).toHaveLength(1);
    expect(result.graph.title).toBe('依赖');
  });

  it('returns empty for blank renderCode', () => {
    expect(parseGraphJson(null).ok).toBe(false);
    expect(parseGraphJson('').ok).toBe(false);
    if (!parseGraphJson(null).ok) {
      expect(parseGraphJson(null).reason).toBe('empty');
    }
  });

  it('returns invalid for bad json', () => {
    const result = parseGraphJson('{not-json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid');
  });

  it('drops edges with missing endpoints and keeps valid nodes', () => {
    const raw = JSON.stringify({
      version: '1.0',
      nodes: [{ id: 'a', label: 'A' }],
      edges: [
        { id: 'e1', source: 'a', target: 'missing' },
        { id: 'e2', source: 'a', target: 'a' },
      ],
    });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.graph.edges.map((e) => e.id)).toEqual(['e2']);
  });

  it('returns empty when no valid nodes', () => {
    const raw = JSON.stringify({ version: '1.0', nodes: [], edges: [] });
    const result = parseGraphJson(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('empty');
  });
});
```

- [x] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.test.ts
```

Expected: FAIL（模块不存在或 `parseGraphJson` 未定义）。

- [x] **Step 3: 写类型与实现**

创建 `types.ts`：

```ts
export type GraphNodeJson = {
  id: string;
  label: string;
  path?: string;
  summary?: string;
};

export type GraphEdgeJson = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type GraphJson = {
  version: string;
  title?: string;
  nodes: GraphNodeJson[];
  edges: GraphEdgeJson[];
};

export type ParseGraphResult =
  | { ok: true; graph: GraphJson }
  | { ok: false; reason: 'empty' | 'invalid' };
```

创建 `parseGraphJson.ts`：

```ts
import type { GraphEdgeJson, GraphJson, GraphNodeJson, ParseGraphResult } from './types';

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
}

export function parseGraphJson(raw: string | null | undefined): ParseGraphResult {
  if (raw == null || !String(raw).trim()) {
    return { ok: false, reason: 'empty' };
  }
  let data: unknown;
  try {
    data = JSON.parse(String(raw));
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'invalid' };
  }
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    return { ok: false, reason: 'invalid' };
  }

  const nodes: GraphNodeJson[] = [];
  const seen = new Set<string>();
  for (const item of obj.nodes) {
    if (!item || typeof item !== 'object') continue;
    const n = item as Record<string, unknown>;
    const id = asNonEmptyString(n.id);
    const label = asNonEmptyString(n.label);
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    const node: GraphNodeJson = { id, label };
    const path = asNonEmptyString(n.path);
    const summary = asNonEmptyString(n.summary);
    if (path) node.path = path;
    if (summary) node.summary = summary;
    nodes.push(node);
  }
  if (nodes.length === 0) {
    return { ok: false, reason: 'empty' };
  }

  const edges: GraphEdgeJson[] = [];
  const edgeIds = new Set<string>();
  for (const item of obj.edges) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const id = asNonEmptyString(e.id);
    const source = asNonEmptyString(e.source);
    const target = asNonEmptyString(e.target);
    if (!id || !source || !target) continue;
    if (edgeIds.has(id)) continue;
    if (!seen.has(source) || !seen.has(target)) continue;
    edgeIds.add(id);
    const edge: GraphEdgeJson = { id, source, target };
    const label = asNonEmptyString(e.label);
    if (label) edge.label = label;
    edges.push(edge);
  }

  const version = asNonEmptyString(obj.version) ?? '1.0';
  const title = asNonEmptyString(obj.title) ?? undefined;
  const graph: GraphJson = { version, nodes, edges };
  if (title) graph.title = title;
  return { ok: true, graph };
}
```

- [x] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/RelationGraph/parseGraphJson.test.ts
```

Expected: PASS。

---

### Task 3: 工作台路径匹配纯函数 + 单测

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.test.ts`

- [x] **Step 1: 写失败单测**

```ts
import { describe, expect, it } from 'vitest';
import { matchWorkbenchPath } from './matchWorkbenchPath';

describe('matchWorkbenchPath', () => {
  const known = ['docs/a.md', 'src/foo/SKILL.md'];

  it('returns exact match', () => {
    expect(matchWorkbenchPath('docs/a.md', known)).toBe('docs/a.md');
  });

  it('normalizes backslash and ./', () => {
    expect(matchWorkbenchPath('.\\docs\\a.md', known)).toBe('docs/a.md');
  });

  it('returns null when missing', () => {
    expect(matchWorkbenchPath('docs/missing.md', known)).toBeNull();
  });
});
```

- [x] **Step 2: 跑测确认失败**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.test.ts
```

Expected: FAIL。

- [x] **Step 3: 实现**

```ts
export function normalizePathKey(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

/** 在已知扫描路径中解析节点 path；失败返回 null */
export function matchWorkbenchPath(
  path: string | undefined,
  knownPaths: string[],
): string | null {
  if (!path) return null;
  const key = normalizePathKey(path);
  if (!key) return null;
  const normalizedKnown = knownPaths.map(normalizePathKey);
  const idx = normalizedKnown.indexOf(key);
  if (idx >= 0) return normalizePathKey(knownPaths[idx]!);
  return null;
}
```

- [x] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/RelationGraph/matchWorkbenchPath.test.ts
```

Expected: PASS。

---

### Task 4: `toFlowElements`（语义图 → xyflow + dagre）

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/toFlowElements.ts`

- [x] **Step 1: 实现布局映射**

```ts
import dagre from 'dagre';
import type { Edge, Node } from '@xyflow/react';
import type { GraphJson } from './types';

export type RelationNodeData = {
  label: string;
  summary?: string;
  path?: string;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

export function toFlowElements(graph: GraphJson): {
  nodes: Node<RelationNodeData>[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 });

  for (const n of graph.nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const e of graph.edges) {
    g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  const nodes: Node<RelationNodeData>[] = graph.nodes.map((n) => {
    const pos = g.node(n.id);
    const data: RelationNodeData = { label: n.label };
    if (n.summary) data.summary = n.summary;
    if (n.path) data.path = n.path;
    return {
      id: n.id,
      position: {
        x: (pos?.x ?? 0) - NODE_WIDTH / 2,
        y: (pos?.y ?? 0) - NODE_HEIGHT / 2,
      },
      data,
      style: { width: NODE_WIDTH },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
  }));

  return { nodes, edges };
}
```

- [x] **Step 2: 类型检查抽查**

```powershell
cd D:\myComponent\WorkBench
yarn exec tsc -b --pretty false 2>&1 | Select-Object -First 40
```

Expected: 与本文件相关无新增报错（若项目其它处已有错误可忽略无关项；至少本文件可被 IDE/tsc 解析）。

---

### Task 5: SSE / hook 消费 `renderCode`

**Files:**
- Modify: `src/apis/qoderSessions/conversation/types.ts`
- Modify: `src/apis/qoderSessions/conversation/index.ts`
- Modify: `src/hooks/useAnalysisStream/index.ts`

- [x] **Step 1: 扩展 handlers 类型**

在 `ConversationStreamHandlers` 增加：

```ts
onRenderCode?: (renderCode: string) => void;
```

- [x] **Step 2: conversation API 转发**

在 `onmessage` 内，`parseSseData` 成功后：

```ts
if (parsed.renderCode) {
  onRenderCode?.(parsed.renderCode);
}
```

（从 `handlers` 解构 `onRenderCode`。）仅在非空字符串时回调；覆盖语义由 hook 负责。

- [x] **Step 3: hook 缓冲与导出**

在 `useAnalysisStream`：

- 增加 state：`renderCode: string | null`（或内部 ref + 结束时再 set；需能驱动右栏，用 state）
- `start` 开头清空：`setRenderCode(null)`（与 markdown 清空一起）
- `abortAndCancel` / 卸载：同样清空 `renderCode`
- 在 conversation 调用中：

```ts
onRenderCode: (code) => {
  if (runId !== runIdRef.current) return;
  setRenderCode(code);
},
```

- 返回值增加 `renderCode: string | null`

`UseAnalysisStreamResult` 同步更新。

- [x] **Step 4: 手动核对**

确认 `start` / `abortAndCancel` / unmount cleanup 均不会留下旧 `renderCode`。

---

### Task 6: `RelationGraph` 组件（画布 + 高亮 + 点击）

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/index.tsx`
- Create: `src/pages/Workbench/components/AnalysisPanel/RelationGraph/index.less`

- [x] **Step 1: 样式**

`index.less`（CSS Module）：

```less
.root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.title {
  flex-shrink: 0;
  margin: 0 0 8px;
  font-family: var(--heading);
  font-weight: 700;
  font-size: 13px;
  color: var(--text-h);
}

.canvas {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border, #e5e5e5);
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.node {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border, #e5e5e5);
  background: #fff;
  font-size: 12px;
  line-height: 1.35;
  color: var(--text, #111);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.nodeActive {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.nodeLabel {
  font-weight: 600;
  font-family: var(--heading);
}

.nodeSummary {
  margin-top: 4px;
  color: var(--text);
  opacity: 0.8;
  font-size: 11px;
}
```

- [x] **Step 2: 组件实现要点**

`index.tsx`：

- props：`graph: GraphJson`；`knownPaths: string[]`；`onSelectFile: (path: string) => void`
- `useMemo(() => toFlowElements(graph), [graph])`
- 本地 state：`activeId: string | null`
- 用 `@xyflow/react`：`ReactFlow`、`Background`、`Controls`、`fitView`
- 自定义节点或 `nodeTypes`：渲染 `label` + 可选 `summary`；`activeId` 及邻居加 `nodeActive`
- `onNodeClick`：设 `activeId`；用 `matchWorkbenchPath(data.path, knownPaths)`，命中则 `onSelectFile(matched)`
- 邻居：凡 `edge.source === id || edge.target === id` 的另一端；边高亮可用 `selected` 或 style
- 引入 `@xyflow/react/dist/style.css`
- 有 `graph.title` 时在画布上方显示

示意骨架（实现时可微调，但行为必须满足 spec）：

```tsx
import {
  Background,
  Controls,
  ReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useState } from 'react';
import styles from './index.less';
import { matchWorkbenchPath } from './matchWorkbenchPath';
import { toFlowElements, type RelationNodeData } from './toFlowElements';
import type { GraphJson } from './types';

export type RelationGraphProps = {
  graph: GraphJson;
  knownPaths: string[];
  onSelectFile: (path: string) => void;
};

function RelationGraph({ graph, knownPaths, onSelectFile }: RelationGraphProps) {
  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => toFlowElements(graph),
    [graph],
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const neighborIds = useMemo(() => {
    if (!activeId) return new Set<string>();
    const s = new Set<string>([activeId]);
    for (const e of baseEdges) {
      if (e.source === activeId) s.add(e.target);
      if (e.target === activeId) s.add(e.source);
    }
    return s;
  }, [activeId, baseEdges]);

  const nodes = useMemo(
    () =>
      baseNodes.map((n) => ({
        ...n,
        className: neighborIds.has(n.id) ? styles.nodeActive : undefined,
        data: n.data,
      })),
    [baseNodes, neighborIds],
  );

  const edges = useMemo(
    () =>
      baseEdges.map((e) => ({
        ...e,
        style:
          activeId && (e.source === activeId || e.target === activeId)
            ? { stroke: 'var(--accent)', strokeWidth: 2 }
            : undefined,
      })),
    [activeId, baseEdges],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      setActiveId(node.id);
      const data = node.data as RelationNodeData;
      const matched = matchWorkbenchPath(data.path, knownPaths);
      if (matched) onSelectFile(matched);
    },
    [knownPaths, onSelectFile],
  );

  return (
    <div className={styles.root}>
      {graph.title ? <h3 className={styles.title}>{graph.title}</h3> : null}
      <div className={styles.canvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RelationGraph;
```

节点外观：可用 `default` 节点 + `style`/`className`，或 `nodeTypes` 自定义显示 `summary`。若 default 节点只显示 `data.label`，则**必须**自定义节点以显示 `summary`。

自定义节点示例：

```tsx
function RelationNode({
  data,
}: {
  data: RelationNodeData;
}) {
  return (
    <div className={styles.node}>
      <div className={styles.nodeLabel}>{data.label}</div>
      {data.summary ? (
        <div className={styles.nodeSummary}>{data.summary}</div>
      ) : null}
    </div>
  );
}
```

并在 `toFlowElements` 给每个 node 设 `type: 'relation'`，`ReactFlow` 传入 `nodeTypes={{ relation: RelationNode }}`。

---

### Task 7: 接入 `AnalysisPanel` 与 `Workbench`

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/types.ts`
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.tsx`
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.less`
- Modify: `src/pages/Workbench/index.tsx`

- [x] **Step 1: 扩展 props**

`types.ts`：

```ts
export type AnalysisPanelProps = {
  mode: AnalysisPanelMode;
  onModeChange: (mode: AnalysisPanelMode) => void;
  onClose: () => void;
  fileName: string;
  fileContent: string;
  /** 扫描得到的相对路径（已规范化更好），供图谱点击联动 */
  knownPaths: string[];
  onSelectFile: (path: string) => void;
};
```

- [x] **Step 2: Workbench 传入**

```tsx
const knownPaths = useMemo(
  () => files.map((f) => f.relativePath.replace(/\\/g, '/')),
  [files],
);

// AnalysisPanel:
knownPaths={knownPaths}
onSelectFile={handleSelectFile}
```

- [x] **Step 3: 右栏状态**

在 `AnalysisPanel`：

```ts
const { start, abortAndCancel, status, markdown, errorMessage, renderCode } =
  useAnalysisStream();

const graphResult = useMemo(() => {
  if (status === 'running') return null;
  if (!renderCode && status === 'idle' && !markdown) return null;
  // 仅在本轮分析结束后解释 renderCode：
  // 约定：running 时不解析；有过分析结束（idle/error 且曾缓冲或已 STOP）时解析
  return parseGraphJson(renderCode);
}, [renderCode, status, markdown]);
```

更清晰的判定（推荐实现）：

| 条件 | 右栏 |
|------|------|
| `status === 'running'` | 占位文案：`关系图谱将在分析完成后显示` |
| `status !== 'running'` 且从未得到终态缓冲需区分：若 `markdown` 为空且 `renderCode` 空且 idle → 仍可用原「关系图谱（占位）」或同上完成前文案 | |
| `status !== 'running'` 且 `parseGraphJson(renderCode).ok` | `<RelationGraph ... />` |
| `status !== 'running'` 且有分析完成意图：`markdown` 非空或 `status==='error'` 或 `renderCode` 非空，但 `!ok && reason==='empty'` | `无文件关联结果` |
| `status !== 'running'` 且 `!ok && reason==='invalid'` | `异常渲染` |

推荐用 hook 增加 `hasCompleted: boolean`（在 `onDone` / 流正常结束设 true；`start`/`abortAndCancel` 重置 false），避免仅靠 markdown 猜测。

在 `useAnalysisStream`：

```ts
const [hasCompleted, setHasCompleted] = useState(false);
// start 开头：setHasCompleted(false)
// onDone 与 try 成功结束：setHasCompleted(true)
// abortAndCancel：setHasCompleted(false)
```

右栏 JSX：

```tsx
<div className={`${styles.pane} ${styles.paneGraph}`}>
  {status === 'running' || !hasCompleted ? (
    <div className={styles.placeholder}>
      {status === 'running'
        ? '关系图谱将在分析完成后显示'
        : '关系图谱（占位）}
    </div>
  ) : graphParsed.ok ? (
    <RelationGraph
      graph={graphParsed.graph}
      knownPaths={knownPaths}
      onSelectFile={onSelectFile}
    />
  ) : graphParsed.reason === 'invalid' ? (
    <div className={styles.placeholder}>异常渲染</div>
  ) : (
    <div className={styles.placeholder}>无文件关联结果</div>
  )}
</div>
```

其中 `graphParsed = parseGraphJson(renderCode)`（`hasCompleted` 为 true 时计算）。

- [x] **Step 4: Less**

`.paneGraph`：`display:flex; flex-direction:column; min-height:0; overflow:hidden;`（保证 ReactFlow 有高度）。

- [x] **Step 5: 本地冒烟**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/components/AnalysisPanel/RelationGraph
yarn dev
```

手工：打开分析工具 → 一键分析（可用 mock/真后端）→ STOP 后右栏出图或两句文案；点节点高亮；有 path 时左侧树选中变化。

---

### Task 8: 后端提示词改为图 JSON

**Files:**
- Modify: `D:\svc\ly-innovation-challenge-svc\src\main\java\com\ly\cloud\service\qoder\impl\QoderSessionServiceImpl.java`（`ANALYSIS_PROMPT_TEMPLATE`）
- Modify: `D:\svc\ly-innovation-challenge-svc\src\main\java\com\ly\cloud\controller\qoder\QoderSessionController.java`（conversation 的 `@Operation` description）

- [x] **Step 1: 替换提示词第 3 点与示例**

将「额外输出一段 Mermaid…」整段改为要求标签内输出语义图 JSON。模板示例（保持 `formatted(RENDER_START, RENDER_END)`）：

```java
private static final String ANALYSIS_PROMPT_TEMPLATE = """
        请分析用户提供的 Cursor Skill 或 Cursor Rule 文件。

        ## 强制要求
        1. 根据文件类型主动调用已绑定 Skill：
           - Skill 文件（SKILL.md / skills 目录）：调用 analyze-cursor-skill
           - Rule 文件（.cursor/rules、.mdc/.md）：调用 analyze-cursor-rule
        2. 严格按对应 Skill 的输出模板组织分析正文，不要跳过 Skill。
        3. 分析完成后，根据文件内容中的文件关联，额外输出一份关系图谱 JSON（供前端 @xyflow 渲染）。
           必须放在下列标签内；标签外禁止出现该 JSON 或 Mermaid；标签内禁止解释性自然语言。
           字段约定：
           - version: 固定 "1.0"
           - title: 可选短标题
           - nodes: 数组；每项必填 id、label；可选 path（仓库相对路径）、summary（≤约20字短说明）
           - edges: 数组；每项必填 id、source、target（均为 node id）；可选 label（短关系词）
           - 不要输出 position/坐标；不要输出可执行代码
        %s
        {
          "version": "1.0",
          "title": "文件关系",
          "nodes": [
            {
              "id": "n1",
              "label": "示例文件",
              "path": "path/to/file.md",
              "summary": "一句短说明"
            },
            {
              "id": "n2",
              "label": "关联文件",
              "path": "path/to/other.md",
              "summary": "一句短说明"
            }
          ],
          "edges": [
            {
              "id": "e1",
              "source": "n1",
              "target": "n2",
              "label": "引用"
            }
          ]
        }
        %s

        ## 待分析文件
        """.formatted(RENDER_START, RENDER_END);
```

- [x] **Step 2: 更新 Controller 描述**

将 conversation 接口 description 中「要求输出 Mermaid」「渲染代码」改为「要求输出关系图谱 JSON；`renderCode` 为 RENDER 标签内图 JSON」。

- [x] **Step 3: 编译抽查**

```powershell
cd D:\svc\ly-innovation-challenge-svc
mvn -q -DskipTests compile
```

Expected: BUILD SUCCESS（若环境无 Maven 或模块需特定 profile，至少保证改动文件无语法问题）。

---

### Task 9: 文档同步收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-analysis-panel-relation-graph-design.md`
- Modify: `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`

- [x] **Step 1: 本 design 状态**

- `状态：设计中` → `状态：已实现`
- 修订记录追加一行：实现落地（右栏图谱 + 后端提示词）

- [x] **Step 2: 流式 design 同步**

- 成功标准/非目标/后续中「不消费 `renderCode` / 右栏占位」改为已由本图谱切片完成（或删除「后续」中对应条并加修订记录）
- 决策表 `renderCode | 忽略` 标注为已被图谱 design 取代

- [x] **Step 3: 对照 spec 测试要点做一次手工勾验**

文档已与实现对齐；手工冒烟未在本轮执行（未启动 `yarn dev` / 未连真后端点验）。

---

## Self-Review（写计划时已做）

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 语义图 JSON 契约 | Task 2、8 |
| RENDER → renderCode 通道 | Task 5、8（分离器不改） |
| STOP 后渲染 | Task 5、7（`hasCompleted`） |
| xyflow + dagre | Task 1、4、6 |
| summary / 边 label 展示 | Task 6 |
| 点击高亮 + 选文件 | Task 3、6、7 |
| 无文件关联结果 / 异常渲染 | Task 7 |
| 不改元 Skill | 无对应改动（有意） |
| 后端提示词 | Task 8 |
| 重分析/关窗清空 | Task 5 |

无 TBD；类型名 `GraphJson` / `parseGraphJson` / `hasCompleted` / `onRenderCode` 前后一致。

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | Task 9 文档同步收尾：relation-graph design → 已实现；stream design 标注 renderCode 决策已被取代 |
| 2026-08-07 | `useAnalysisStream` 迁至 `src/hooks/useAnalysisStream/` |
