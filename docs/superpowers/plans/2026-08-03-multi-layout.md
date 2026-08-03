# WorkBench 多 Layout 分层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将现有单一 `App` 根 Layout 拆成 `MainLayout` / `WorkbenchLayout` / `BlankLayout` 三个路由兄弟分支，使多壳可并存且工作台业务页内容不变。

**Architecture:** `createBrowserRouter` 下并列三个 Layout 根分支；壳组件放在 `src/layouts/*`，只负责导航/侧栏/`Outlet`；全局 Provider 仍在 `main.tsx`；删除 `App.tsx` / `App.less`。

**Tech Stack:** React 19、Vite、`react-router-dom`、Less CSS Modules（与现有一致）

**Spec:** `docs/superpowers/specs/2026-08-03-multi-layout-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下列 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File map

| File | Responsibility |
|------|----------------|
| `src/layouts/MainLayout/index.tsx` | 顶栏导航 + Outlet（自 App 迁入） |
| `src/layouts/MainLayout/index.less` | 自 `App.less` 迁入 |
| `src/layouts/WorkbenchLayout/index.tsx` | 简易顶栏（回首页）+ 静态侧栏 + Outlet |
| `src/layouts/WorkbenchLayout/index.less` | 工作台壳布局样式 |
| `src/layouts/BlankLayout/index.tsx` | 无导航极简容器 + Outlet |
| `src/layouts/BlankLayout/index.less` | 全屏容器样式（可选但本计划创建） |
| `src/pages/BlankPlaceholder/index.tsx` | `/blank` index：文案「BlankLayout 挂点」 |
| `src/router/index.tsx` | 三兄弟分支路由表；移除 `@/App` |
| `src/App.tsx` / `src/App.less` | **删除** |
| `src/pages/Workbench/index.tsx` | **不改内容**（仍 `return null`） |
| `src/main.tsx` | **不改**（已挂 RouterProvider） |
| `src/apis/**` / RegexSettings / Home / NotFound | **不改** |
| `docs/superpowers/specs/2026-08-03-multi-layout-design.md` | 状态改为已实现 |
| `docs/superpowers/specs/2026-07-30-routing-scaffold-design.md` | 修订记录：根 Layout 改为多 Layout |

---

### Task 1: 创建 MainLayout（迁入 App）

**Files:**
- Create: `src/layouts/MainLayout/index.less`
- Create: `src/layouts/MainLayout/index.tsx`

- [x] **Step 1: 创建样式文件**

将现有 `src/App.less` 全文写入 `src/layouts/MainLayout/index.less`（内容不变）：

```less
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);

  a {
    color: var(--text-h);
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

- [x] **Step 2: 创建 MainLayout 组件**

创建 `src/layouts/MainLayout/index.tsx`：

```tsx
import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 主站 Layout：顶部导航 + 子路由出口
 */
function MainLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/">首页</Link>
        <Link to="/workbench">工作台</Link>
        <Link to="/regex-settings">正则设置</Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
```

- [x] **Step 3: 自检**

确认文件存在、无对 `@/App` 的依赖；本步暂不改路由（Task 4 统一接线）。

- [x] **Step 4: Commit（默认跳过）**

仅当用户要求时再提交。

---

### Task 2: 创建 BlankLayout + BlankPlaceholder

**Files:**
- Create: `src/layouts/BlankLayout/index.less`
- Create: `src/layouts/BlankLayout/index.tsx`
- Create: `src/pages/BlankPlaceholder/index.tsx`

- [x] **Step 1: 创建 BlankLayout 样式**

`src/layouts/BlankLayout/index.less`：

```less
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [x] **Step 2: 创建 BlankLayout 组件**

`src/layouts/BlankLayout/index.tsx`：

```tsx
import { Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 空白 Layout：无导航，供登录/全屏等页挂载
 */
function BlankLayout() {
  return (
    <div className={styles.shell}>
      <Outlet />
    </div>
  );
}

export default BlankLayout;
```

- [x] **Step 3: 创建 BlankPlaceholder 页**

`src/pages/BlankPlaceholder/index.tsx`：

```tsx
/**
 * BlankLayout 路由挂点占位（非业务页）
 */
function BlankPlaceholder() {
  return <p>BlankLayout 挂点</p>;
}

export default BlankPlaceholder;
```

- [x] **Step 4: Commit（默认跳过）**

---

### Task 3: 创建 WorkbenchLayout

**Files:**
- Create: `src/layouts/WorkbenchLayout/index.less`
- Create: `src/layouts/WorkbenchLayout/index.tsx`

- [x] **Step 1: 创建样式**

`src/layouts/WorkbenchLayout/index.less`：

```less
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}

.title {
  margin: 0;
  font-size: 16px;
  color: var(--text-h);
}

.homeLink {
  color: var(--text-h);
  text-decoration: none;

  &:hover {
    color: var(--accent);
  }
}

.body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sider {
  width: 200px;
  flex-shrink: 0;
  padding: 16px 12px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.siderLink {
  color: var(--text-h);
  text-decoration: none;
  padding: 6px 8px;

  &:hover {
    color: var(--accent);
  }
}

.siderItem {
  padding: 6px 8px;
  color: var(--text);
  opacity: 0.7;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
```

- [x] **Step 2: 创建 WorkbenchLayout 组件**

`src/layouts/WorkbenchLayout/index.tsx`：

```tsx
import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 工作台 Layout：简易顶栏 + 静态侧栏 + 内容区 Outlet
 */
function WorkbenchLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>工作台</h1>
        <Link className={styles.homeLink} to="/">
          返回首页
        </Link>
      </header>
      <div className={styles.body}>
        <aside className={styles.sider}>
          <Link className={styles.siderLink} to="/workbench">
            工作台首页
          </Link>
          <span className={styles.siderItem}>占位菜单 A</span>
          <span className={styles.siderItem}>占位菜单 B</span>
        </aside>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default WorkbenchLayout;
```

- [x] **Step 3: 确认不改 Workbench 业务页**

打开 `src/pages/Workbench/index.tsx`，保持现有实现不变（当前为 `return null`）。本 Task 只新增 Layout。

- [x] **Step 4: Commit（默认跳过）**

---

### Task 4: 重写路由表为三兄弟分支

**Files:**
- Modify: `src/router/index.tsx`

- [x] **Step 1: 替换 `src/router/index.tsx` 全文**

```tsx
import BlankLayout from '@/layouts/BlankLayout';
import MainLayout from '@/layouts/MainLayout';
import WorkbenchLayout from '@/layouts/WorkbenchLayout';
import BlankPlaceholder from '@/pages/BlankPlaceholder';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import RegexSettings from '@/pages/RegexSettings';
import Workbench from '@/pages/Workbench';
import { createBrowserRouter } from 'react-router-dom';

/**
 * 将 Vite BASE_URL 转为 react-router basename（无尾部斜杠；根路径不传）
 */
function getBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'regex-settings', element: <RegexSettings /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      path: '/workbench',
      element: <WorkbenchLayout />,
      children: [{ index: true, element: <Workbench /> }],
    },
    {
      path: '/blank',
      element: <BlankLayout />,
      children: [{ index: true, element: <BlankPlaceholder /> }],
    },
  ],
  { basename: getBasename() },
);
```

注意：`workbench` 已从 MainLayout `children` 移除，改由独立分支挂载。`getBasename` 逻辑不得改动。

- [x] **Step 2: 确认无 `@/App` 引用**

在仓库内搜索 `from '@/App'` / `from \"@/App\"`，应仅剩（或即将删除的）`App.tsx` 自身；`router` 不得再 import App。

- [x] **Step 3: Commit（默认跳过）**

---

### Task 5: 删除 App 并做手工验收

**Files:**
- Delete: `src/App.tsx`
- Delete: `src/App.less`

- [x] **Step 1: 删除旧根 Layout**

删除 `src/App.tsx`、`src/App.less`。

- [x] **Step 2: 启动开发服务**

在 `D:\myComponent\WorkBench` 执行：

```powershell
npm run dev
```

Expected: 编译成功，无找不到 `@/App` 的报错。

- [x] **Step 3: 手工验收清单**

按 Spec 验收（浏览器）：

1. 打开 `/`：见 MainLayout 顶栏（首页 / 工作台 / 正则设置）+ Home 内容  
2. 打开 `/regex-settings`：仍为顶栏壳 + 正则页  
3. 点击顶栏「工作台」或打开 `/workbench`：见 WorkbenchLayout（标题「工作台」、返回首页、侧栏「工作台首页」+ 两个占位项）；内容区与改前一致（当前为空/`null`，无业务回归）  
4. 打开不存在路径（如 `/no-such-page`）：MainLayout + NotFound  
5. 打开 `/blank`：仅见「BlankLayout 挂点」，**无** MainLayout 顶栏  
6. 确认 `/workbench`、`/blank` **不是** MainLayout 下的 404  

- [x] **Step 4: Commit（默认跳过）**

---

### Task 6: 同步 design 文档状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-03-multi-layout-design.md`
- Modify: `docs/superpowers/specs/2026-07-30-routing-scaffold-design.md`

- [x] **Step 1: 更新多 Layout 规格状态**

将 `2026-08-03-multi-layout-design.md` 顶部：

```markdown
状态：待实现
```

改为：

```markdown
状态：已实现
```

并在「修订记录」追加一行：

```markdown
- 2026-08-03：实现完成（三 Layout 兄弟分支；删除 App 根 Layout）。
```

- [x] **Step 2: 修订路由脚手架规格（避免文档仍写 App 为唯一根 Layout）**

在 `2026-07-30-routing-scaffold-design.md` 的「修订记录」追加：

```markdown
- 2026-08-03：根 Layout 拆为 MainLayout / WorkbenchLayout / BlankLayout 兄弟分支；详见 `2026-08-03-multi-layout-design.md`。`App.tsx` 已删除。
```

并在该文档「目录结构」中把 `App.tsx` / `App.less` 两行改为指向 `layouts/`（与 multi-layout 规格一致即可，不必重写全文）。

建议将「目录结构」中相关片段替换为：

```
src/
  main.tsx                 # 挂载 RouterProvider
  layouts/
    MainLayout/            # 顶栏壳
    WorkbenchLayout/       # 工作台侧栏壳
    BlankLayout/           # 无导航壳
  router/
    index.tsx              # createBrowserRouter 路由表（多 Layout 分支）
  pages/
    Home/
    Workbench/
    RegexSettings/
    NotFound/
    BlankPlaceholder/      # /blank 挂点占位
```

路由表说明处：原「Layout → Workbench」改为 WorkbenchLayout；并注明 `/blank` 见 multi-layout 规格。

- [x] **Step 3: Commit（默认跳过）**

---

## Spec coverage checklist（自检）

| Spec 要求 | Task |
|-----------|------|
| MainLayout 挂 Home / regex-settings / 404 | Task 1, 4 |
| WorkbenchLayout 挂 `/workbench`，业务不改 | Task 3, 4；Task 3 Step 3 |
| BlankLayout + `/blank` +「BlankLayout 挂点」 | Task 2, 4 |
| 删除 App，Provider 仍在 main | Task 5；main 不改 |
| 不改 apis / RegexSettings / Workbench 逻辑 | File map + Task 3 Step 3 |
| basename 不变 | Task 4 保留 `getBasename` |
| WorkbenchLayout 侧栏 + 回首页顶栏 | Task 3 |
| 手工验收匹配 Spec | Task 5 Step 3 |
| 文档同步 | Task 6 |
