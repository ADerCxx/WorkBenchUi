# WorkBench 路由脚手架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 WorkBench 接入 `react-router-dom`，形成带 Layout、Home、Workbench、RegexSettings、404 的 SPA 路由脚手架，且 `basename` 与 Vite `base` 对齐。

**Architecture:** `createBrowserRouter` + `RouterProvider`；根 route 为 `App` Layout（导航 + `Outlet`）；页面放在 `src/pages/*`；现有欢迎页迁入 `Home`。

**修订（2026-07-31）：** 移除 Demo；新增 `Workbench`（占位）、`RegexSettings`（模拟表格）；顶栏为「首页 / 工作台 / 正则设置」。

**Tech Stack:** React 19、Vite 8、`react-router-dom`（与 React 19 兼容的当前大版本）、Less CSS Modules

**Spec:** `docs/superpowers/specs/2026-07-30-routing-scaffold-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。

---

## File map

| File | Responsibility |
|------|----------------|
| `package.json` / lockfile | 增加 `react-router-dom` |
| `src/router/index.tsx` | 路由表 + basename + 导出 `router` |
| `src/main.tsx` | `RouterProvider` 挂载 |
| `src/App.tsx` / `src/App.less` | Layout：导航 + Outlet |
| `src/pages/Home/index.tsx` + `index.less` | 原 App 业务内容 |
| `src/pages/Workbench/index.tsx` | 工作台占位 |
| `src/pages/RegexSettings/index.tsx` | 正则白名单模拟表格 |
| `src/pages/NotFound/index.tsx` | 404 |

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`（及 lockfile）

- [ ] **Step 1: 安装 react-router-dom**

在 `D:\myComponent\WorkBench` 执行：

```powershell
npm install react-router-dom
```

Expected: `package.json` 的 `dependencies` 出现 `react-router-dom`，安装成功无报错。

---

### Task 2: 迁移首页

**Files:**
- Create: `src/pages/Home/index.tsx`
- Create: `src/pages/Home/index.less`（内容 = 现有 `src/App.less`）
- Delete or empty later: 原 `App.tsx` 业务部分（Task 4 重写）

- [ ] **Step 1: 复制样式**

将 `src/App.less` 全文复制为 `src/pages/Home/index.less`。

- [ ] **Step 2: 创建 Home 页面**

`src/pages/Home/index.tsx`：把现有 `App.tsx` 业务逻辑原样迁入，组件名改为 `Home`，样式改为 `import styles from './index.less'`，资源路径改为 `@/assets/...` 或相对路径 `../../assets/...`（与项目 `@` alias 一致优先用 `@/assets`）。文案中若提到 `src/App.tsx`，可改为 `src/pages/Home/index.tsx`。

```tsx
import { ReportEventCategoryApi } from '@/apis/report/eventCategory/list';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import styles from './index.less';
import heroImg from '@/assets/hero.png';
import reactLogo from '@/assets/react.svg';
import viteLogo from '@/assets/vite.svg';

/**
 * 首页：欢迎页与请求示例
 */
function Home() {
  // ... 原 App 内状态与 JSX 不变 ...
}

export default Home;
```

---

### Task 3: Demo 与 NotFound

**Files:**
- Create: `src/pages/Demo/index.tsx`
- Create: `src/pages/NotFound/index.tsx`
- Create: `src/pages/NotFound/index.less`

- [ ] **Step 1: Demo 页**

```tsx
import { Link } from 'react-router-dom';

/**
 * 路由示例页，用于验证客户端跳转
 */
function Demo() {
  return (
    <section style={{ padding: 24 }}>
      <h1>Demo</h1>
      <p>这是路由示例页，用于验证客户端跳转。</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default Demo;
```

- [ ] **Step 2: NotFound 页**

```tsx
import { Link } from 'react-router-dom';
import styles from './index.less';

/**
 * 404 页面
 */
function NotFound() {
  return (
    <section className={styles.page}>
      <h1>404</h1>
      <p>页面不存在</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default NotFound;
```

```less
.page {
  padding: 24px;
}
```

---

### Task 4: Layout（App）

**Files:**
- Modify: `src/App.tsx`（整文件重写为 Layout）
- Modify: `src/App.less`（整文件改为导航样式）

- [ ] **Step 1: 重写 App.tsx**

```tsx
import { Link, Outlet } from 'react-router-dom';
import styles from './App.less';

/**
 * 根布局：顶部导航 + 子路由出口
 */
function App() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link to="/">首页</Link>
        <Link to="/demo">Demo</Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 重写 App.less（Layout 极简样式）**

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

---

### Task 5: 路由表与入口

**Files:**
- Create: `src/router/index.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 创建 router**

```tsx
import App from '@/App';
import Demo from '@/pages/Demo';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
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
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'demo', element: <Demo /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: getBasename() },
);
```

- [ ] **Step 2: 更新 main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles/index.global.less';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

---

### Task 6: 验证

- [ ] **Step 1: 类型检查 / 构建**

```powershell
npm run build
```

Expected: `tsc -b` 与 `vite build` 成功。

- [ ] **Step 2: 开发态手工验证（若 dev 已开或可短时启动）**

- 打开 `/`，见首页内容与顶栏「首页 / 工作台 / 正则设置」
- 点工作台 → URL 为 `/workbench`，页面切换无整页刷新（占位可为空）
- 点正则设置 → `/regex-settings`，见模拟数据表格
- 访问 `/not-exist-xyz` → 404
- 在 `/regex-settings` 刷新 → 仍为该页（Vite history fallback）

---

## Spec coverage

| Spec 要求 | Task |
|-----------|------|
| 安装 react-router-dom | Task 1 |
| createBrowserRouter + basename | Task 5 |
| Home 迁入现有内容 | Task 2 |
| Workbench / RegexSettings / NotFound | Task 3（历史为 Demo；2026-07-31 已替换） |
| Layout 导航 + Outlet | Task 4 |
| main 使用 RouterProvider | Task 5 |
| 本机验证 | Task 6 |

## 已知实现注意点

- 已删除 `src/pages/Demo`；勿再引用 `/demo`
- 正则设置页无 antd，使用原生 `<table>` + 页面内常量模拟数据
- 2026-08-05：NotFound 使用 CSS Module（`index.less`），勿再写 `style={{ padding: 24 }}`
