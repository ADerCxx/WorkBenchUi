# 工作台目录侧栏折叠与树节点体验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 左侧目录侧栏支持收起为约 48px 窄条（交界中部把手），树节点用文件夹/Markdown 图标区分，长名称单行省略且仅截断时 Tooltip。

**Architecture:** 新建 `CatalogSidebar` 壳管理展开/收起宽度与右缘把手，内部组合现有 `CatalogTree`；`CatalogTree` 用 antd Tree 的 `showIcon`/`icon` 渲染类型图标，`titleRender` + `Typography.Text` ellipsis 处理省略与截断 Tooltip。折叠状态仅存在于 `CatalogSidebar`。

**Tech Stack:** React 19、antd 6（Tree / Typography / Empty / Spin）、`@ant-design/icons`、Less CSS Modules

**Spec:** `docs/superpowers/specs/2026-08-06-workbench-catalog-sidebar-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。本轮以手工验收为主，不强制组件单测。

**Skills（实现时遵守）:** `module-file-layout`、`css-module-less`、`typography`；收尾按 `sync-design-plan` 将 spec 标为已实现（本计划已含该步）。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `src/pages/Workbench/components/CatalogSidebar/types.ts` | `CatalogSidebarProps`（与 CatalogTree 业务 props 对齐） |
| `src/pages/Workbench/components/CatalogSidebar/index.less` | 壳宽度、内容区、交界把手 |
| `src/pages/Workbench/components/CatalogSidebar/index.tsx` | 折叠态 + 把手 + 组合 CatalogTree |
| `src/pages/Workbench/components/CatalogTree/index.tsx` | 图标 + 省略标题 |
| `src/pages/Workbench/components/CatalogTree/index.less` | 节点行省略样式 |
| `src/pages/Workbench/index.tsx` | `CatalogTree` → `CatalogSidebar` |
| `src/pages/Workbench/index.less` | `.catalog` 去掉定宽，改容器布局 |
| `docs/superpowers/specs/2026-08-06-workbench-catalog-sidebar-design.md` | 状态改为已实现 |

---

### Task 1: 增强 `CatalogTree`（图标 + 省略）

**Files:**
- Modify: `src/pages/Workbench/components/CatalogTree/index.tsx`
- Modify: `src/pages/Workbench/components/CatalogTree/index.less`
- Keep: `src/pages/Workbench/components/CatalogTree/types.ts`（无需改 props）

- [x] **Step 1: 更新样式**

将 `src/pages/Workbench/components/CatalogTree/index.less` 替换为：

```less
.loading {
  padding: 24px;
  text-align: center;
}

.empty {
  margin-top: 48px;
}

.tree {
  padding: 8px;

  :global {
    .ant-tree-node-content-wrapper {
      display: flex;
      align-items: center;
      min-width: 0;
      overflow: hidden;
    }

    .ant-tree-title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .ant-tree-iconEle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
    }
  }
}

.nodeTitle {
  display: block;
  width: 100%;
  margin: 0;
  color: inherit;
  font-family: var(--sans);
}
```

- [x] **Step 2: 更新组件**

将 `src/pages/Workbench/components/CatalogTree/index.tsx` 替换为：

```tsx
import {
  FileMarkdownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Empty, Spin, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import styles from './index.less';
import type { CatalogTreeProps } from './types';

export type { CatalogTreeProps } from './types';

function renderTreeIcon(props: {
  isLeaf?: boolean;
  expanded?: boolean;
}) {
  if (props.isLeaf) {
    return <FileMarkdownOutlined />;
  }
  return props.expanded ? <FolderOpenOutlined /> : <FolderOutlined />;
}

function renderTreeTitle(node: DataNode) {
  const title = typeof node.title === 'string' ? node.title : String(node.title ?? '');
  return (
    <Typography.Text
      className={styles.nodeTitle}
      ellipsis={{ tooltip: true }}
    >
      {title}
    </Typography.Text>
  );
}

/**
 * 左侧目录树；仅叶子可选中。
 */
function CatalogTree({
  hasPicked,
  loading,
  treeData,
  selectedPath,
  onSelectFile,
  emptyDescription = '未扫描到匹配的白名单文件',
}: CatalogTreeProps) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    );
  }

  if (!hasPicked) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择项目根目录"
      />
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyDescription}
      />
    );
  }

  const defaultExpandedKeys = treeData.map((n) => n.key);

  return (
    <Tree
      className={styles.tree}
      key={treeData.map((n) => n.key).join('|')}
      treeData={treeData}
      selectedKeys={selectedPath ? [selectedPath] : []}
      defaultExpandedKeys={defaultExpandedKeys}
      showIcon
      icon={renderTreeIcon}
      titleRender={renderTreeTitle}
      onSelect={(keys, info) => {
        if (!info.node.isLeaf) return;
        const key = String(keys[0] ?? '');
        if (key) onSelectFile(key);
      }}
    />
  );
}

export default CatalogTree;
```

说明：图标走 Tree 的 `icon`（能拿到 `expanded`/`isLeaf`），等价于 spec「titleRender 或等价」；标题省略走 `titleRender`。

- [x] **Step 3: 手工验收树节点**

启动开发服，打开工作台，选项目根并扫描出树后确认：

1. 文件夹与 md 文件图标可区分
2. 折叠/展开文件夹时图标在 `FolderOutlined` / `FolderOpenOutlined` 间切换
3. 缩窄浏览器或侧栏时，长文件名单行省略；短名悬停无 Tooltip，长名截断后有 Tooltip
4. 点击叶子仍能预览；点文件夹不选中

Expected: 上述四点均通过。本 Task 侧栏仍为固定 300px（折叠在 Task 2）。

---

### Task 2: 新建 `CatalogSidebar` 折叠壳

**Files:**
- Create: `src/pages/Workbench/components/CatalogSidebar/types.ts`
- Create: `src/pages/Workbench/components/CatalogSidebar/index.less`
- Create: `src/pages/Workbench/components/CatalogSidebar/index.tsx`

- [x] **Step 1: 写 types**

创建 `src/pages/Workbench/components/CatalogSidebar/types.ts`：

```ts
import type { CatalogTreeProps } from '../CatalogTree/types';

/** 与 CatalogTree 业务 props 对齐，由壳下传 */
export type CatalogSidebarProps = CatalogTreeProps;
```

- [x] **Step 2: 写样式**

创建 `src/pages/Workbench/components/CatalogSidebar/index.less`：

```less
.root {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 300px;
  min-height: 0;
  height: 100%;
  border-right: 1px solid var(--border);
  background: var(--bg);
  transition: width 0.2s ease;
}

.rootCollapsed {
  width: 48px;
}

.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.bodyHidden {
  display: none;
}

.toggle {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 48px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 4px 0 0 4px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transform: translate(50%, -50%);
}

.toggle:hover {
  color: var(--text-h);
  border-color: var(--text);
}
```

- [x] **Step 3: 写组件**

创建 `src/pages/Workbench/components/CatalogSidebar/index.tsx`：

```tsx
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useState } from 'react';
import CatalogTree from '../CatalogTree';
import styles from './index.less';
import type { CatalogSidebarProps } from './types';

export type { CatalogSidebarProps } from './types';

/**
 * 目录侧栏壳：展开/收起宽度 + 交界中部把手；内部组合 CatalogTree。
 */
function CatalogSidebar(props: CatalogSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${styles.root}${collapsed ? ` ${styles.rootCollapsed}` : ''}`}
    >
      <div
        className={`${styles.body}${collapsed ? ` ${styles.bodyHidden}` : ''}`}
      >
        <CatalogTree {...props} />
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-label={collapsed ? '展开目录侧栏' : '收起目录侧栏'}
        title={collapsed ? '展开目录侧栏' : '收起目录侧栏'}
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </button>
    </div>
  );
}

export default CatalogSidebar;
```

- [x] **Step 4: 确认文件存在**

```powershell
Get-ChildItem D:\myComponent\WorkBench\src\pages\Workbench\components\CatalogSidebar
```

Expected: 列出 `index.tsx`、`index.less`、`types.ts`。

---

### Task 3: Workbench 挂载侧栏壳

**Files:**
- Modify: `src/pages/Workbench/index.tsx`
- Modify: `src/pages/Workbench/index.less`

- [x] **Step 1: 改页面 less**

将 `src/pages/Workbench/index.less` 中 `.catalog` 改为容器（宽度交给 Sidebar）：

```less
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.catalog {
  display: flex;
  flex-shrink: 0;
  min-height: 0;
  /* 宽度由 CatalogSidebar 承担；勿再写 300px / border */
}

.preview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
```

- [x] **Step 2: 改页面挂载**

在 `src/pages/Workbench/index.tsx`：

1. 将 `import CatalogTree from './components/CatalogTree';` 改为：

```tsx
import CatalogSidebar from './components/CatalogSidebar';
```

2. 将 `<aside>` 内的 `CatalogTree` 替换为：

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

其余扫描 / 预览 / 分析逻辑不动。

- [x] **Step 3: 全量手工验收**

1. 展开约 300px，收起约 48px；预览区随之变宽/变窄
2. 把手在右缘垂直居中；展开显示向左箭头，收起显示向右箭头；可键盘聚焦并 Enter/Space 切换
3. 收起后看不到树、Empty、Spin，无法点选文件；再展开后选中态与预览仍在
4. 图标、省略、Tooltip 行为与 Task 1 一致
5. 回归：选文件夹扫描、选文件预览、分析入口禁用逻辑正常

Expected: 全部通过。

---

### Task 4: 同步 design 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-workbench-catalog-sidebar-design.md`

- [x] **Step 1: 标记已实现**

将文首：

```md
状态：设计中
```

改为：

```md
状态：已实现
```

- [x] **Step 2: 勾选本 plan 已完成 Task**

将本文件 Task 1–4 的 `- [ ]` 改为 `- [x]`（若执行中已勾选可跳过）。

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 交界中部把手、300↔48 | Task 2–3 |
| 收起隐藏树 | Task 2 `bodyHidden` |
| 文件夹/MD 图标 + 开合切换 | Task 1 `showIcon`/`icon` |
| 单行省略 + 仅截断 Tooltip | Task 1 `Typography.Text` ellipsis |
| 不持久化、不拖拽调宽 | 未实现（YAGNI） |
| 既有选文件/空态/加载不变 | Task 1/3 保留逻辑 |
| design 标已实现 | Task 4 |

---

## 已知实现注意点（2026-08-06 微调）

- 树省略：`blockNode` + treenode/content-wrapper/title/`nodeTitle` 全链路 `min-width: 0` + `overflow: hidden`，否则 antd Tree 会随文字撑开不出现省略号。
- 折叠钮：圆形 28px、`border-radius: 50%`、底色 + 浅阴影；悬浮用 antd `Tooltip` + `styles.container`（`rgba(0,0,0,0.72)`、`borderRadius: 8`、无箭头），不用原生 `title`。
- 文件名截断 Tip 同样使用上述 dark tooltip styles。
- 树节点间距：收紧 switcher `margin-inline-end`、`.ant-tree-iconEle` 宽 16px、content-wrapper `gap: 4px` + `padding-inline: 2px 4px`，避免展开图标与标题之间过空。
