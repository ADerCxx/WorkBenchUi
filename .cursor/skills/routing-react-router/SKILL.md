---
name: routing-react-router
description: >-
  Use when 新增或修改页面路由（src/router）、把新页面接入路由体系、写跳转与导航链接、
  配置懒加载与 Suspense 兜底、写 404 或路由级错误页、声明路由元数据（标题/菜单）、
  用 URL query 承载页面状态，或判断"新增一个页面该怎么接进路由"时。
---

# React Router 路由写法约定

## Overview

约束 **路由放哪、怎么声明、怎么兜底、怎么跳转**。
目标：任何一个 URL 都有明确归属，任何一处报错都有可见反馈，新增页面不需要重复样板代码。

**Violating the letter of the rules is violating the spirit of the rules.**

前置条件：本仓 React 19 + `react-router-dom` v7（数据路由 API，`createBrowserRouter`）。
本仓取值（版本、现有区域、文件清单）见 [reference.md](reference.md)。

---

## When to Use

- 新增页面并接入路由
- 修改路由表（`src/router/routes.tsx`）
- 新增/修改布局（layout）与 `<Outlet />`
- 写 `<Link>`、`useNavigate` 跳转
- 处理 404、路由级错误兜底
- 声明页面标题、菜单等元数据
- 用 URL query / params 承载页面状态

**When NOT to use**

- 纯 Toast / Modal / Drawer 等非路由弹层 → 用局部 state
- 同一个页面内的 Tab 切换且**不需要可分享/可刷新保持** → 局部 state
- 需要跨路由存活的业务状态 → `state-management-zustand`（本 skill 不管）
- 服务端取数 → `api-request`；本仓**不使用 loader/action 取数**（见下）

---

## 目录结构：router 模块的四段分工

```text
src/router/
├── index.tsx          # 只负责创建 router 实例 + basename
├── routes.tsx         # 路由表本体：路径、element、handle、errorElement、兜底
├── paths.ts           # 路径常量（唯一来源）
├── types.ts           # RouteMeta 元数据类型
├── menu.ts            # 导航菜单数据（依赖 paths，不依赖组件）
├── MetaSync/          # 无 UI 根布局：title 同步 + 最外层 Suspense
└── RouteFallback/     # 懒加载统一占位 UI
```

**为什么拆这么细**

| 文件 | 拆出来的理由 |
| --- | --- |
| `index.tsx` 只留创建逻辑 | 换 basename / history 模式时不碰路由表 |
| `paths.ts` | 消灭散落的字面量；改路径只改一处 |
| `menu.ts` | **必须与组件解耦**——若 menu 反过来依赖 MainLayout，会与 routes.tsx 形成循环依赖 |

布局、页面各自按 `module-file-layout` 落盘：`src/layouts/XxxLayout/`、`src/pages/Xxx/`。

---

## 三条硬规则（改路由表时必须遵守）

### 规则一：每个顶层区域都要有自己的 `* `兜底

```tsx
// ✅ 正确：每个区域各自兜底
{ path: PATHS.workbench, element: <WorkbenchLayout />, children: [
    { index: true, element: <Workbench /> },
    { path: '*', element: <NotFound /> },   // ← 本区域的未知路径留在本区域
]},
```

**为什么**：React Router 的兜底路由 `*` 是**按路径前缀竞争**的。若只有 `/` 区域挂了 `*`（即 `/*`），
那么 `/workbench/xxx` 在本区域匹配失败后，会**掉到 `/*` 上去匹配**——
结果是"用户访问的是工作台地址，页面却在首页布局里显示 404"。不报错、不白屏，但产品体验是错的。

所以：**有一层 `* `在根做安全网不够，每个区域都要有。**

### 规则二：每个持有 element 的路由都要配 errorElement

```tsx
{ path: PATHS.home, element: <MainLayout />, errorElement: <RouteError />, children: [...] }
```

**为什么**：页面组件渲染期抛错、或 loader 抛错时，React Router 会向上找最近的 `errorElement`；
一路找不到就落到框架内置错误页——开发环境是一屏堆栈，**生产环境表现为白屏**。

错误页统一用 `src/pages/RouteError`，它内部用 `useRouteError()` + `isRouteErrorResponse()` 区分：

| 错误形态 | 呈现 |
| --- | --- |
| `isRouteErrorResponse` 且 status 404 | 「404 页面不存在」 |
| status 401 / 403 | 「没有访问权限」 |
| `Error` 实例 | 「页面出错了」+ `error.message` |
| 其他 | 「发生了未知错误」 |

错误堆栈 (`error.stack`) **只在 `import.meta.env.DEV` 下渲染**，禁止把堆栈带进生产。

### 规则三：页面组件必须 lazy，且 Suspense 边界由上层提供

```tsx
const Workbench = lazy(() => import('@/pages/Workbench'));   // ✅ routes.tsx 里静态 import 是禁止的
```

Suspense **写在 Layout 的 `<Outlet />` 外层**，不要逐个路由 element 包裹：

```tsx
// ✅ 推荐：一次包好，新增页面不可能忘记
<main className={styles.main}>
  <Suspense fallback={<RouteFallback />}>
    <Outlet />
  </Suspense>
</main>

// ❌ 禁止：每个 element 手工包一层，漏一个就是白屏
{ index: true, element: suspense(<Home />) }
```

`MetaSync` 内部也有最外层 Suspense，**根级兜底路由也能安全懒加载**。

> 这条的设计哲学：**让错误不可能发生**，而不是提醒自己"记得加 Suspense"。

---

## 新增页面的标准流程

按顺序做，一步都不能跳：

| 步骤 | 动作 | 文件 |
|:--:|---|---|
| 1 | 按 `module-file-layout` 建页面模块（`index.tsx` + `index.less`，需要类型则加 `types.ts`） | `src/pages/Xxx/` |
| 2 | 在 `paths.ts` 加路径常量 | `src/router/paths.ts` |
| 3 | 在 `routes.tsx` 顶部 `lazy` 引入，挂到对应区域的 `children`，补 `handle.title` | `src/router/routes.tsx` |
| 4 | 若主站导航需要入口，在 `menu.ts` 加一项 | `src/router/menu.ts` |
| 5 | **不需要**手写 Suspense（Layout 已提供） | — |

不要做的事：不在 `index.tsx`（router 实例文件）里写路由；不在组件里写路径字面量；
不为了省事把新页面塞进 `/` 区域的 children 里（除非它确实属于主站）。

---

## 路径常量

```ts
// src/router/paths.ts
export const PATHS = {
  home: '/',
  workbench: '/workbench',
} as const;
```

**禁止**在组件里写 `<Link to="/workbench">`，一律 `<Link to={PATHS.workbench}>`。
`children` 里需要相对路径段时，用 `childPath(PATHS.xxx)` 从绝对路径派生，**不要写第二份字面量**。

---

## 元数据：handle + MetaSync

每条叶子路由声明 `handle`：

```tsx
{ index: true, element: <Home />, handle: { title: '首页' } satisfies RouteMeta }
```

`MetaSync` 取**最深一条**带 title 的匹配写入 `document.title`（子路由覆盖父路由），
拼成 `标题 · 站点名`。

新增元字段必须先在 `src/router/types.ts` 的 `RouteMeta` 里登记，
**禁止在 handle 上挂未声明的字段**（否则类型散落、无法统一消费）。

注意有两个不同的 API，别弄混：

| API | 返回结构 | handle 在哪 |
| --- | --- | --- |
| `useMatches()`（组件内） | `UIMatch[]` | **直接**挂在 match 上：`match.handle` |
| `matchRoutes()`（纯逻辑/测试） | `RouteMatch[]` | 挂在 `match.route.handle` |

---

## 导航与跳转

| 场景 | 写法 |
| --- | --- |
| 站内链接 | `<Link to={PATHS.workbench}>`（**唯一允许的方式**，不要 `<a href>`） |
| 事件后跳转 | `const navigate = useNavigate(); navigate(PATHS.home);` |
| 需要替换历史栈 | `navigate(PATHS.home, { replace: true })` |
| 外部链接 | `<a href={url} target="_blank" rel="noreferrer">` |

回到上一步优先用 `navigate(-1)`，不要硬编码"上一个页面"的路径。

---

## URL 状态：什么该放进 URL

| 状态 | 放哪 |
| --- | --- |
| 筛选条件、分页、排序、Tab | ✅ URL query（`useSearchParams`）——可分享、可刷新、可后退 |
| 跨路由存活的业务状态（向导进度、选中项） | `state-management-zustand` |
| 只在单个组件内用 | `useState` |

**禁区**：不要把服务端返回的列表数据塞进 URL；不要把"可分享的筛选条件"放 store 导致刷新即丢失。

---

## 权限守卫（本仓暂未启用）

当前项目无登录态，`RouteMeta.requiresAuth` 恒为空。
接入鉴权时按此顺序落地（**不要提前写**）：

1. `paths.ts` 增加 `login` 路径；
2. `RouteMeta` 补 `requiresAuth?: boolean`、`roles?: string[]`；
3. 新增 `src/router/guards/RequireAuth.tsx`：读 store 里的登录态，未登录则
   `<Navigate to={PATHS.login} replace state={{ from: location }} />`（带回跳来源）；
4. 在 `routes.tsx` 里把需要保护的分支包一层 `<RequireAuth><Outlet /></RequireAuth>`；
5. 菜单按权限过滤（`menu.ts` 补 `requiresAuth` 字段）。

守卫**放在布局路由里做**而不是每个组件里各自判断，避免漏判与闪烁。

---

## 反模式表

| ❌ 别这样 | 为什么 | ✅ 正确做法 |
| --- | --- | --- |
| 只有根/首页区域挂 `*` | 其他区域的未知路径会掉到首页布局去渲染 404 | 每个顶层区域各自兜底 |
| 有 element 却没 errorElement | 出错冒泡到框架默认错误页，生产黑屏/白屏 | 每个持有 element 的路由都配 |
| 逐个 element 包 Suspense | 漏一个就白屏 | Layout 的 Outlet 外层统一包 |
| `handle` 挂 Schema 外的字段 | 消费方不知道、类型散落 | 先在 `RouteMeta` 登记 |
| 组件里写 `<Link to="/xxx">` | 改路径要全局搜 | 用 `PATHS` |
| `menu.ts` 里 import 布局组件 | 与 routes.tsx 循环依赖 | 菜单数据只依赖 paths |
| 生产渲染 `error.stack` | 泄漏实现细节 | 仅 `import.meta.env.DEV` 渲染 |
| 把筛选条件存进 store | 刷新即丢、无法分享 | 放 URL query |

---

## 自检清单（改完路由跑一遍）

- [ ] 每个顶层区域都有 `* `兜底？
- [ ] 每个持有 element 的路由都有 errorElement？
- [ ] 新增页面用 `lazy` 了吗？
- [ ] 路径用的是 `PATHS`，没有字面量？
- [ ] 每条叶子路由有 `handle.title`？
- [ ] 本地 `npx tsc -b` 通过、`npx vitest run` 通过？

想验证某条 URL 会落到哪个区域、取到什么 title，可以用 `matchRoutes` 写一次性脚本：

```ts
matchRoutes(routes, '/workbench/xxx'); // → [/workbench > *]，handle 在 match.route.handle
```
