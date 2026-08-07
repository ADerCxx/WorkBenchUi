# Workbench FabricLoading 接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/workbench` 用 `FabricLoading` 替换目录树 antd `Spin`，并为分析工具结果区、图谱区补上区域级品牌 loading；按钮 antd loading 保持不动。

**Architecture:** 各调用点条件渲染已有 `@/components/FabricLoading`（`size="sm"`），不扩展组件 API、不抽包装层、不改 `ConfigProvider`。结果区在 `running && !markdown` 显示 loading；图谱区在 `status === 'running'` 显示 loading。

**Tech Stack:** React、Less CSS Modules、现有 `FabricLoading`、antd（按钮 loading 保留）

**Spec:** `docs/superpowers/specs/2026-08-07-workbench-fabric-loading-integration-design.md`

**Commit 约定:** 本仓库当前要求 AI **不自动 git commit**；各 Task 完成后只做本地验证，改动留在工作区供人工审阅提交。

---

## File structure

| 文件 | 职责 |
|------|------|
| `src/pages/Workbench/components/CatalogTree/index.tsx` | 扫描 loading：`Spin` → `FabricLoading` |
| `src/pages/Workbench/components/CatalogTree/index.less` | `.loading` 改为 flex 居中 |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 结果区 / 图谱区条件渲染 `FabricLoading` |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 结果区与图谱区 loading 容器居中样式 |
| `docs/superpowers/specs/2026-08-07-workbench-fabric-loading-integration-design.md` | 实现后更新状态与验收勾选（sync-design-plan） |
| `docs/superpowers/specs/2026-08-07-fabric-loading-design.md` | 修订记录注明已接入工作台（可选一句） |

不改：`FabricLoading` 本体、`WorkbenchHeader`、分析按钮 `LoadingOutlined`、`useAnalysisStream`。

仓库无组件单测框架；验收以手动 UI 检查为准（见各 Task 验证步）。

---

### Task 1: CatalogTree 替换 Spin

**Files:**
- Modify: `src/pages/Workbench/components/CatalogTree/index.tsx`
- Modify: `src/pages/Workbench/components/CatalogTree/index.less`

- [x] **Step 1: 替换 loading 分支与 import**

在 `CatalogTree/index.tsx`：

1. 删除 antd `Spin` 导入；若 `Empty` / `Tree` / `Typography` 仍需要则保留 `antd` 导入。
2. 增加：

```tsx
import FabricLoading from '@/components/FabricLoading';
```

3. 将 loading 分支改为：

```tsx
if (loading) {
  return (
    <div className={styles.loading}>
      <FabricLoading size="sm" />
    </div>
  );
}
```

- [x] **Step 2: 调整 `.loading` 居中**

在 `CatalogTree/index.less`，将：

```less
.loading {
  padding: 24px;
  text-align: center;
}
```

改为：

```less
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
```

- [x] **Step 3: 手动验证目录树**

Run: 启动开发服务，打开 `/workbench`，点击「选择文件夹」触发扫描。

Expected:
- 扫描中目录区出现品牌扫光 `FabricLoading`（非 antd 转圈）
- 顶栏「选择文件夹」按钮仍为 antd `loading` 样式（未改）
- 扫描结束后正常显示树或 Empty

- [x] **Step 4: 不 commit**（留工作区）

---

### Task 2: AnalysisPanel 结果区 + 图谱区 FabricLoading

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.tsx`
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.less`

- [x] **Step 1: 增加 import 与样式类**

在 `AnalysisPanel/index.tsx` 顶部增加：

```tsx
import FabricLoading from '@/components/FabricLoading';
```

**保留** `LoadingOutlined` 与按钮 `icon={status === 'running' ? <LoadingOutlined /> : undefined}`，不要删除。

在 `AnalysisPanel/index.less` 增加（可放在 `.placeholder` 附近）：

```less
.paneLoading {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.resultCardLoading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}
```

- [x] **Step 2: 改图谱区 `graphPane` 分支**

将现有：

```tsx
let graphPane: ReactNode;
if (status === 'running' || graphParsed === null) {
  graphPane = (
    <div className={styles.placeholder}>
      {status === 'running'
        ? '关系图谱将在分析完成后显示'
        : '关系图谱（占位）'}
    </div>
  );
} else if (graphParsed.ok) {
  // ...
}
```

替换为：

```tsx
let graphPane: ReactNode;
if (status === 'running') {
  graphPane = (
    <div className={styles.paneLoading}>
      <FabricLoading size="sm" />
    </div>
  );
} else if (graphParsed === null) {
  graphPane = (
    <div className={styles.placeholder}>关系图谱（占位）</div>
  );
} else if (graphParsed.ok) {
  graphPane = (
    <RelationGraph
      graph={graphParsed.graph}
      knownPaths={knownPaths}
      onSelectFile={onSelectFile}
    />
  );
} else if (graphParsed.reason === 'invalid') {
  graphPane = <div className={styles.placeholder}>异常渲染</div>;
} else {
  graphPane = <div className={styles.placeholder}>无文件关联结果</div>;
}
```

（`ok` / `invalid` / else 分支与改前保持一致，仅拆开 `running`。）

- [x] **Step 3: 改结果区 `resultCard` 内容**

将：

```tsx
<div className={styles.resultCard}>
  {markdown ? (
    <MarkdownPreview source={markdown} className={styles.result} />
  ) : (
    <div className={styles.empty}>暂无结果</div>
  )}
</div>
```

替换为：

```tsx
<div className={styles.resultCard}>
  {status === 'running' && !markdown ? (
    <div className={styles.resultCardLoading}>
      <FabricLoading size="sm" />
    </div>
  ) : markdown ? (
    <MarkdownPreview source={markdown} className={styles.result} />
  ) : (
    <div className={styles.empty}>暂无结果</div>
  )}
</div>
```

- [x] **Step 4: 手动验证分析工具**

Run: `/workbench` 选文件 → 打开分析工具 → 点「一键分析」。

Expected:
- 点击后结果区立刻出现 `FabricLoading`（不再只显示「暂无结果」）
- 收到首段 markdown 后结果区切到流式正文；图谱区在整个 `running` 期间保持 `FabricLoading`
- 分析完成后图谱按现有逻辑展示（图 / 异常渲染 / 无文件关联）
- 失败或取消后两侧 loading 消失，不永久转圈
- 「一键分析 / 重新分析」按钮仍可出现 `LoadingOutlined`（未改）
- 未点分析时图谱仍为「关系图谱（占位）」

- [x] **Step 5: 不 commit**（留工作区）

---

### Task 3: 同步 design / plan 文档状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-workbench-fabric-loading-integration-design.md`
- Modify: `docs/superpowers/specs/2026-08-07-fabric-loading-design.md`（修订记录一句即可）
- Modify: `docs/superpowers/plans/2026-08-07-workbench-fabric-loading-integration.md`（勾选已完成 Task）

- [x] **Step 1: 更新 integration design**

- 状态：`待实现` → `已实现`
- 验收清单全部勾选为 `[x]`
- 修订记录追加一行，例如：`2026-08-07 | 工作台 CatalogTree + AnalysisPanel 双区接入落地`

- [x] **Step 2: 更新 FabricLoading 组件 design 修订记录**

在 `2026-08-07-fabric-loading-design.md` 修订记录追加：已接入工作台目录树与分析工具区域 loading（按钮未改）。不必改写其「本轮不接入」历史决策段落全文，以免混淆历史；用修订记录说明即可。

- [x] **Step 3: 勾选本 plan 中 Task 1–3 已完成步骤**

- [x] **Step 4: 不 commit**（留工作区）

---

## 已知实现注意点

1. `markdown` 初始为 `''`，`!markdown` 对空串为 true；`start()` 会先 `setMarkdown('')`，重新分析时结果区会再次进入 loading，符合预期。
2. 图谱失败路径依赖 `status === 'error'` 离开 `running`，不要改成 `!hasCompleted`。
3. `paneGraph` 已是 flex 列；`.paneLoading` 用 `flex: 1` 才能在图谱栏垂直居中。
4. 同步文档时遵守 `.cursor/skills/sync-design-plan/SKILL.md`：决策与验收写 design，步骤勾选写 plan。

---

## Spec coverage (self-review)

| Spec 要求 | Task |
|-----------|------|
| CatalogTree 去 Spin → FabricLoading | Task 1 |
| 结果区 `running && !markdown` | Task 2 Step 3 |
| 图谱区 `status === 'running'` | Task 2 Step 2 |
| 按钮 loading 不动 | Task 1/2 明确保留；验收步检查 |
| 不改 FabricLoading API | 全 plan 仅 import 使用 |
| design 验收勾选 / 状态 | Task 3 |
