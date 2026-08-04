# 工作台 — 选择文件夹（目录树 + 原文预览）

日期：2026-08-03  
状态：已实现

## 目标

在 WorkBench 的 `/workbench` 完成「文件选择」功能切片：用户选择**项目根目录**后，按硬编码约定扫描文件，左侧以**真实目录层级**展示，点击文件后在右侧显示路径与原文纯文本，用于验证点击有效。

参照材料：`src/工作台选择文件.md`、ForgeKit `docs/skillRuleWorkbench` demo、截图（选文件夹入口 + 左栏 + 内容区）。本轮只吸收「选文件夹 → 扫描 → 呈现」主线，不复刻 demo 的 Skills/Rules 分组与关系图。

### 成功标准

1. `/workbench` 页内呈现：顶栏（含「选择文件夹」）+ 左目录树 + 右内容区
2. 用户选择项目根后，仅扫描第一层 `.cursor` / `docs` / `openSpecs`，收集其中全部 `.md` / `.mdc`
3. 左侧树保留相对路径层级；仅文件节点可选中
4. 选中文件后右侧显示 `relativePath` + 原文纯文本（非 Markdown 渲染）
5. 未选目录 / 扫描中 / 零命中 / 未选文件均有明确空态或 loading

## 非目标

- Markdown 渲染预览（后续独立功能点）
- 刷新、关系图、导出 JSON
- 用正则设置页规则驱动扫描（后端/配置化扫描后续再接）
- Dev 中间件自动扫描项目文件
- 从 ForgeKit 搬迁 parse / graph / AI 关系分析
- 改动 `src/apis/regex/**`
- 像素级复刻 ForgeKit 视觉或 Skills/Rules 卡片列表

## 已确认决策

| 项 | 选择 |
| --- | --- |
| 左栏形态 | 真实目录树（非 Skills/Rules 分组）；细节后续再优化 |
| 扫描规则 | 硬编码三个约定根 + 全部 `.md` / `.mdc` |
| 点文件 | 路径 + 原文纯文本 |
| 工具栏 | 仅「选择文件夹」 |
| 选目录约定 | 用户选择**项目根**；不支持「直接选单个约定根」作为主路径 |
| 页面壳 | `/workbench` 挂 `BlankLayout`；页内自持顶栏 + 左树 + 右内容 |
| 技术方案 | 方案 1：页内自持壳 + 精简扫描模块（不搬 ForgeKit 大段代码） |

## 技术方案

### 路由与壳

- `/workbench` 的 `element` 改为 `BlankLayout`，`children` 仍挂 `pages/Workbench`
- 现有 `WorkbenchLayout` **保留文件、本轮路由不使用**，避免与页内三栏抢布局
- 全局 Provider（`ConfigProvider` 等）仍在 `main.tsx`，不变

### 页内结构

```
pages/Workbench
├─ 顶栏：标题「Skill / Rule 工作台」+「选择文件夹」
├─ 左栏：目录树 / Empty / Spin
└─ 右栏：Empty 或 路径 + 原文
```

建议目录（一组件一文件夹，`index.tsx` 入口 + 可选 `types.ts`）：

```
src/pages/Workbench/
  index.tsx                 # 状态编排
  index.less
  scan/
    types.ts
    constants.ts            # 约定根名、跳过目录、扩展名
    pickProjectRoot.ts      # showDirectoryPicker
    scanHardcodedRoots.ts   # walk + 读文本
    buildTree.ts            # RawFile[] → Tree 数据
  components/
    WorkbenchHeader/
      index.tsx
      types.ts              # WorkbenchHeaderProps
    CatalogTree/
      index.tsx
      types.ts              # CatalogTreeProps
    RawPreview/
      index.tsx
      types.ts              # RawPreviewProps
```

### 数据流

```
选择文件夹
  → showDirectoryPicker({ mode: 'read' })
  → 仅进入项目根第一层命中的约定根（.cursor / docs / openSpecs，忽略大小写）
  → 根内递归；跳过 node_modules、.git
  → 命中 .md / .mdc，读取 text()
  → RawFile[] { relativePath, content }
  → buildTree → treeData
  → contentByPath: Map<path, content>
  → 重置 selectedPath
```

缺某个约定根：静默跳过。  
扫描时一并读入 content；点击只查 Map。

### 类型（最小）

```ts
type RawFile = { relativePath: string; content: string };

type WorkbenchTreeNode = {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: WorkbenchTreeNode[];
};
```

树按 `relativePath` 以 `/` 分段插入；只保留有命中文件的分支。

### UI 与空态

| 区域 | 状态 | 表现 |
| --- | --- | --- |
| 左栏 | 未选目录 | Empty：「请先选择项目根目录」 |
| 左栏 | 扫描中 | Spin |
| 左栏 | 有结果 | Antd Tree，默认展开第一层约定根 |
| 左栏 | 零命中 | Empty：「未扫描到 .md / .mdc」 |
| 右栏 | 未选文件 | Empty：「从左侧选择文件」 |
| 右栏 | 已选文件 | 顶部路径 + `<pre>`/等宽滚动原文 |

仅叶子（文件）可选中；目录节点只展开/折叠。  
顶栏可选展示已选根目录名（`dirHandle.name`）。  
加载中按钮 `loading`。

### 错误处理

| 情况 | 行为 |
| --- | --- |
| 不支持 `showDirectoryPicker` | `message.error`，状态不变 |
| 用户取消选择 | 静默，状态不变 |
| 单文件读取失败 | 跳过该文件并继续；不中断整次扫描 |
| 扫描过程其它异常 | `message.error`；若有上一次成功结果可保留 |

### 测试

- 保留 Vitest 基建（`vitest.config.ts`、`npm test`）；本轮不保留 `scan` 下业务单测文件
- `buildTree` / pathMatch 等以手工验证为主；后续需要时再补 `*.test.ts`
- Directory Picker / 真机选目录：手工验证清单

## 与 ForgeKit demo 的关系

| Demo 行为 | 本轮 WorkBench |
| --- | --- |
| 约定根名单较长 + Skill/Rule 路径命中 | 仅三根 + 全部 md/mdc |
| Skills/Rules 分组目录 | 真实路径树 |
| Dev 自动扫描 | 不做 |
| 解析 / 关系图 / 导出 | 不做 |
| 可选「直接选约定根」 | 不做（约定选项目根） |

实现时可**对照** demo 的 `showDirectoryPicker` / walk 写法，但代码落在 WorkBench，不建立运行时依赖。

## 后续衔接（本轮不实现）

- 正则设置页规则驱动扫描
- Markdown 渲染预览
- 刷新、关系分析、导出
- 恢复或演进 `WorkbenchLayout` 应用侧栏与工作台业务的组合方式

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-03 | 实现选文件夹切片：BlankLayout + scan 模块 + 左树右原文；类型名定为 `WorkbenchTreeNode`；补充 `file-system-access.d.ts`；状态改为已实现。 |
| 2026-08-04 | 按 `module-file-layout`：`WorkbenchHeader` / `CatalogTree` / `RawPreview` 改为文件夹模块（`index.tsx` + `types.ts` Props）。 |
| 2026-08-04 | 移除 `scan` 下 `*.test.ts` 及 Vitest 依赖/配置；验证改为手工。 |
| 2026-08-04 | 恢复 Vitest 基建（配置/脚本/依赖）；仍不保留 scan 业务单测文件。 |
