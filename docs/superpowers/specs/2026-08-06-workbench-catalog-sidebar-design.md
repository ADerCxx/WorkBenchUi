# 工作台 — 目录侧栏折叠与树节点体验

日期：2026-08-06  
状态：已实现  

## 目标

优化工作台左侧目录侧栏：支持收起/展开为窄图标条；目录树节点用图标区分文件夹与 Markdown 文件；长名称单行省略，仅在截断时悬停展示全名。

### 成功标准

1. 侧栏右缘垂直居中**圆形**把手可切换展开（约 300px）与收起（约 48px）；收起时树内容不可见，预览区变宽；悬停显示半透明黑底圆角标签
2. 文件夹与叶子文件图标可区分；文件夹开合图标随树节点展开态变化
3. 节点标题单行、超出省略号、不换行；仅当文字被截断时 Tooltip 显示全名（半透明黑底圆角）
4. 选文件、空态、加载态、默认展开等既有行为保持不变

## 非目标

- 折叠态持久化（localStorage / 跨会话）
- 拖拽调节侧栏宽度
- 引入新图标包或自定义 SVG 资源
- 改动扫描、白名单、PreviewPane、分析浮窗等既有能力
- 非 `.md` 文件类型的差异化图标（当前扫描结果叶子均为白名单命中文档，统一用 Markdown 文件图标）

## 背景

工作台布局为顶栏 + 左 `aside.catalog`（固定 300px）+ 右预览。目录由 `CatalogTree`（antd `Tree`）展示，无侧栏折叠、无文件夹/文件图标、标题可自然换行。用户需要更多预览空间时无法收起侧栏，且深层级长路径下难以一眼区分目录与文档。

## 决策

采用 **CatalogSidebar 壳 + 增强 CatalogTree**（方案 3）。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 结构 | 新建 `CatalogSidebar` 包住 `CatalogTree` | 壳管折叠/宽度/把手；树管节点体验 |
| 收起形态 | 约 48px 窄条 | 仍占位；树内容隐藏 |
| 触发器 | 侧栏与预览交界、右缘垂直居中把手 | 不用 Layout.Sider 默认触发器，也不放顶栏 |
| 折叠状态 | `CatalogSidebar` 内部 `useState`，默认展开 | 不持久化 |
| 图标 | `@ant-design/icons`：文件夹 `FolderOutlined` / `FolderOpenOutlined`，叶子 `FileMarkdownOutlined` | 偏文件树观感；不新增依赖 |
| 省略 + Tooltip | 树节点宽度链约束 + `Typography.Text` ellipsis；仅截断时出 Tip；Tip 为半透明黑底圆角（无箭头） | 文件名与折叠钮共用该 Tip 风格 |
| 折叠把手 | 圆形 28px、有底色与浅阴影；antd `Tooltip` 自定义样式（非原生 `title`） | 交界中部垂直居中 |
| 页面宽度 | 从 `Workbench/index.less` 的 `.catalog` 定宽迁到壳 | 页面只保留挂载位布局 |

## 技术方案

### 结构

```
src/pages/Workbench/components/CatalogSidebar/   # 新建：折叠壳
  index.tsx
  index.less
  types.ts

src/pages/Workbench/components/CatalogTree/      # 改：图标 + 省略
  index.tsx
  index.less
  types.ts

src/pages/Workbench/index.tsx                    # 挂 CatalogSidebar
src/pages/Workbench/index.less                   # .catalog 不再写死 300px 宽（或仅作容器）
```

### 组件职责

| 单元 | 做什么 | 怎么用 | 依赖 |
|------|--------|--------|------|
| `CatalogSidebar` | 展开/收起宽度、交界把手、收起时隐藏树 | 直接组合 CatalogTree，对外 props 与现树对齐 | 本地 `collapsed` |
| `CatalogTree` | 树数据展示、图标、省略与截断 Tooltip | 现有 props 不变 | antd Tree / Typography / icons |
| `Workbench` | 把原 aside 内容换成 Sidebar 包树 | 扫描与选中逻辑不变 | 不感知折叠细节 |

### `CatalogSidebar` 约定

- Props：对外暴露与现 `CatalogTree` 相同的业务 props，内部组合 `CatalogTree`，避免 Workbench 多包一层。
- 展开宽：`300px`；收起宽：`48px`；`flex-shrink: 0`；右边框保留。
- 把手：贴右缘垂直居中；**圆形 28px**、底色 `var(--bg)` + 边框 + 浅阴影；点击切换；展开态向左箭头、收起态向右箭头；`aria-label` + antd `Tooltip`（半透明黑底圆角、无箭头），不用原生 `title`。
- 收起时：树区域 `display: none`，避免窄条内仍可点选；空态/Spin 同样隐藏。
- 样式：CSS Module + 同级 `index.less`；颜色用 `--border` / `--text` / `--bg` 等变量；Tooltip 外观用 `styles.container` 覆盖 cssinjs。

### `CatalogTree` 约定

- Props 类型保持现有 `CatalogTreeProps`（可按需微调，不改变 Workbench 调用语义）。
- 用 `titleRender`（或等价）渲染：左侧类型图标 + 标题文本。
- 文件夹：`node.isLeaf` 为假；展开用 `FolderOpenOutlined`，收起用 `FolderOutlined`（依据 Tree 展开态）。
- 叶子：`FileMarkdownOutlined`。
- 标题：Tree 设 `blockNode`；treenode → content-wrapper → title → `.nodeTitle` 全链路 `min-width: 0` / `overflow: hidden`；单行省略；Tooltip 仅截断时出现，样式为半透明黑底圆角。展开箭头 / 类型图标 / 标题间距收紧（switcher 无额外 margin、icon 宽 16px、content `gap: 4px` + 较小 padding）。
- 不替换 Tree 自带展开箭头；图标与箭头并存。
- 选中、仅叶子可点、`defaultExpandedKeys` 等逻辑不变。

### Workbench 挂载

```tsx
<aside className={styles.catalog}>
  <CatalogSidebar
    hasPicked={hasPicked}
    loading={loading}
    treeData={treeData}
    selectedPath={selectedPath}
    onSelectFile={handleSelectFile}
    emptyDescription={emptyDescription}
  />
</aside>
```

`.catalog` 可改为 `flex-shrink: 0` + `min-height: 0` + `display: flex`（宽度由 Sidebar 根节点承担），避免双重定宽冲突。

## 错误处理与边界

- 未选根 / 加载中 / 零命中：行为同现网；仅在侧栏展开时可见对应 Empty / Spin。
- 收起后再展开：树重新可见；选中态与 `selectedPath` 保持（不因折叠清空）。
- 无障碍：把手为 `button`，键盘可聚焦并激活。

## 测试（手工验收）

1. 展开 ↔ 收起：宽度与预览区变化正确；收起后无法点到树节点
2. 图标：目录与 md 文件可辨；展开/收起文件夹时图标切换
3. 长文件名：不换行、省略号；短名无 Tooltip，长名截断后有 Tooltip
4. 回归：选文件预览、空态、加载、分析入口禁用逻辑仍正常

## Skills

实现时遵守：`module-file-layout`、`css-module-less`、`typography`；收尾按 `sync-design-plan` 将本 spec 标为已实现。

## 修订记录

- 2026-08-06：手工验收反馈 — 修复树标题省略宽度链；折叠钮改为圆形有底色；悬浮标签改为半透明黑底圆角自定义 Tooltip（文件名与折叠钮一致）。
- 2026-08-06：收紧目录树展开箭头 / 类型图标 / 标题间距，减少空旷感。
