# 工作台接入 FabricLoading

日期：2026-08-07  
状态：已实现  
依赖：`docs/superpowers/specs/2026-08-07-fabric-loading-design.md`（组件已落地）

## 目标

在工作台（`/workbench`）用品牌组件 `FabricLoading` 替换目录树区域的 antd `Spin`，并在分析工具的结果区、图谱区补上区域级 loading；按钮上的 antd loading 保持不变。

### 成功标准

1. `CatalogTree` 扫描中不再渲染 antd `Spin`，改为 `FabricLoading`
2. 分析结果区：分析进行中且尚未收到首段 markdown 时显示 `FabricLoading`；首包到达后展示流式内容
3. 关系图谱区：`status === 'running'` 时显示 `FabricLoading`；结束后沿用现有图谱 / 占位 / 异常逻辑
4. 顶栏「选择文件夹」、分析面板「一键分析 / 重新分析」按钮的 antd loading / `LoadingOutlined` 不改动
5. 不修改 `FabricLoading` 组件 API

## 非目标

- 不通过 `ConfigProvider` 全局替换 antd `Spin` indicator
- 不改按钮内 loading 视觉
- 不做完成态动画或文案 tip
- 不新增 `FabricLoadingPane` 等包装组件（本轮仅三处接入）

## 背景

`FabricLoading` 已作为全局可复用组件交付，原设计明确「本轮不接入业务」。工作台现有区域 loading 为：

| 位置 | 现状 |
|------|------|
| `CatalogTree` | `loading` 时 `<Spin />` |
| `WorkbenchHeader` 选择文件夹 | `Button loading={loading}`（保留） |
| `AnalysisPanel` 结果区 | 无区域 loading；无 markdown 时「暂无结果」 |
| `AnalysisPanel` 图谱区 | `running` 时文案「关系图谱将在分析完成后显示」 |
| `AnalysisPanel` 分析按钮 | `LoadingOutlined`（保留） |

## 决策

采用 **各调用点直接条件渲染 `FabricLoading`**（不抽包装、不改全局 Spin）。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| CatalogTree | `Spin` → `FabricLoading` | 去掉 `Spin` import |
| 结果区 loading 条件 | `status === 'running' && !markdown` | 「第一次正式响应」= 首段流式 markdown |
| 图谱区 loading 条件 | `status === 'running'` | 与失败/取消自然结束对齐，避免 `!hasCompleted` 卡死 |
| 按钮 | 不动 | 用户明确要求 |
| 尺寸 | 三处均 `size="sm"` | 侧栏与双栏宽度下 `md`/`lg` 过大 |
| 组件 API | 不扩展 | 调用方控制显隐 |

## 技术方案

### 改动文件

| 文件 | 变更 |
|------|------|
| `src/pages/Workbench/components/CatalogTree/index.tsx` | `Spin` → `FabricLoading`；必要时微调 `index.less` 居中 |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 结果区、图谱区按条件渲染 `FabricLoading` |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 结果区 / 图谱区 loading 容器居中（若现有 placeholder 不够） |

### 显示条件

**CatalogTree**

```tsx
if (loading) {
  return (
    <div className={styles.loading}>
      <FabricLoading size="sm" />
    </div>
  );
}
```

**分析结果区（`resultCard` 内）**

| 条件 | 展示 |
|------|------|
| `status === 'running' && !markdown` | `<FabricLoading size="sm" />` 居中 |
| `markdown` 有内容 | `<MarkdownPreview />`（含 running 中流式更新） |
| 其它且无 markdown | 「暂无结果」 |

**关系图谱区**

| 条件 | 展示 |
|------|------|
| `status === 'running'` | `<FabricLoading size="sm" />` 居中（替换原 running 文案） |
| `graphParsed === null` 且非 running | 「关系图谱（占位）」 |
| `graphParsed.ok` | `<RelationGraph />` |
| `invalid` / 无关联 | 现有文案不变 |

### 布局

- 目录树：沿用 `.loading`；改为 flex 居中（若当前 `text-align:center` 对 inline-flex 图标不够）
- 结果区 / 图谱区：在现有 pane / placeholder 容器内水平垂直居中，不引入全屏遮罩

## 验收

- [x] 选择文件夹扫描时，目录树显示品牌扫光 loading，无 antd Spin
- [x] 点「一键分析」后：结果区立刻出现 FabricLoading，收到首段 markdown 后切换为流式正文
- [x] 同一次分析中：图谱区在整个 `running` 期间显示 FabricLoading；完成后按解析结果展示
- [x] 分析失败或取消：图谱区 / 结果区 loading 结束，不永久转圈
- [x] 按钮 loading 视觉与改前一致
- [x] `FabricLoading` 的 props / 尺寸档未改

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 初稿：目录树替换 + 分析双区接入；图谱条件定为 A（`running`） |
| 2026-08-07 | 工作台 CatalogTree + AnalysisPanel 双区接入落地 |
