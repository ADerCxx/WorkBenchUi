# WorkBench 多 Layout 分层设计

日期：2026-08-03  
状态：已实现

## 目标

为 WorkBench 建立明确的 Layout 层次，支持多种壳并存，提升路由结构的可读性与扩展性。原 `App.tsx` 曾充当根 Layout，但无法清晰表达「管理顶栏壳 / 工作台侧栏壳 / 无导航全屏壳」等分支。

### 成功标准

1. `/`、`/regex-settings`、未知路径走 `MainLayout`（顶栏导航壳）
2. `/workbench` 走 `WorkbenchLayout`（侧栏壳）；`pages/Workbench` 业务内容不变
3. `BlankLayout` 文件存在，并以明确 path（`/blank`）挂到路由表，暂无业务子页
4. 路由不再以 `App.tsx` 为根；全局 Provider 仍在 `main.tsx`
5. 不改 `src/apis/**`，不改 RegexSettings / Workbench 业务逻辑
6. `basename` 与 Vite `BASE_URL` 行为保持不变

## 非目标

- 不做登录鉴权、权限路由、菜单配置中心
- 不做路由懒加载、`loader` / `action`
- 不扩展工作台业务功能（仅引用 `WorkbenchLayout`）
- 不改 Antd 主题以外的全局 Provider 结构（本轮仍只在 `main` 挂 `ConfigProvider`）

## 背景与现状

现有层次：

```
main.tsx（StrictMode + ConfigProvider + RouterProvider）
  → App.tsx（顶栏 + Outlet，名义上的根 Layout）
    → pages/*
```

路由脚手架规格（`2026-07-30-routing-scaffold-design.md`）已将 `App` 定义为根 Layout。本变更将其拆为多个显式 Layout，并以路由兄弟分支挂载。

## 技术方案

采用 **路由兄弟分支 + `src/layouts/` 目录**（方案 1）：

- `createBrowserRouter` 下并列多个 Layout 根分支，各自 `children` 挂业务页
- Layout 只负责壳 UI（导航 / 侧栏 / 容器）与 `<Outlet />`
- 全局 Provider 继续放在 `main.tsx`，不引入空的根 `App` 仅作 Outlet 转发

未采用：保留空根 `App`（假层次）；或在单一 `App` 内按 path 切换壳（扩展性差）。

## 目录结构

```
src/
  main.tsx                 # StrictMode + Antd ConfigProvider + RouterProvider
  router/
    index.tsx              # 三个 Layout 兄弟分支
  layouts/
    MainLayout/
      index.tsx            # 现有 App 顶栏导航迁入
      index.less
    WorkbenchLayout/
      index.tsx            # 静态侧栏 + 内容区 Outlet；可选简易顶栏（回首页）
      index.less
    BlankLayout/
      index.tsx            # 仅 Outlet（或极简全屏容器）
      index.less           # 可选
  pages/
    Home/                  # 不变
    RegexSettings/         # 不变
    Workbench/             # 业务内容不变，仅外层换壳
    NotFound/              # 不变
    BlankPlaceholder/    # /blank 挂点占位
```

已删除：`src/App.tsx`、`src/App.less`（样式已迁入 `MainLayout`）。

## 路由表

| 路径 | Layout | 页面 | 说明 |
|------|--------|------|------|
| `/` | MainLayout | Home | 首页 |
| `/regex-settings` | MainLayout | RegexSettings | 正则设置 |
| `*`（MainLayout 下） | MainLayout | NotFound | 未知路径 |
| `/workbench` | WorkbenchLayout | Workbench | 工作台；日后子路由挂此分支 |
| `/blank` | BlankLayout | BlankPlaceholder | 预留挂点，不进主导航；渲染「BlankLayout 挂点」占位文案 |

嵌套关系示例（概念）：

```ts
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
    children: [
      { index: true, element: <Workbench /> },
    ],
  },
  {
    path: '/blank',
    element: <BlankLayout />,
    children: [
      { index: true, element: /* 极简占位：「BlankLayout 挂点」 */ },
    ],
  },
]
```

`basename` 推导逻辑保持现有 `getBasename()` 不变。

路由匹配注意：`/workbench`、`/blank` 为与 MainLayout 根分支同级的静态 path，须高于 MainLayout 下 `*` 的匹配优先级（react-router 默认排名通常满足）。实现后手工确认这两条路径不会落入 MainLayout 404。

## 组件职责

### MainLayout

- 从现有 `App` 迁入：顶栏 `Link`（首页、工作台、正则设置）+ `<main><Outlet /></main>`
- 视觉与交互与现状基本一致
- 「工作台」链至 `/workbench`

### WorkbenchLayout

- 左侧静态侧栏（硬编码菜单即可）
  - 至少一项：「工作台首页」→ `/workbench`
  - 可另放 1–2 个占位项（可不跳转或指向同页）
- 右侧内容区 `<Outlet />` 渲染 `pages/Workbench`
- 简易顶栏（必做）：标题 + 回到站点首页（`/`）的链接；不复制 MainLayout 的完整顶栏菜单
- 不做菜单配置中心、不做工作台业务模块

### BlankLayout

- 无导航全屏/极简容器，只渲染 `<Outlet />`
- 本轮无业务子页；`/blank` 的 `index` 渲染极简占位文案「BlankLayout 挂点」

### pages/Workbench

- 内容与改前一致（占位即可）
- 唯一变化：外层壳从 `App` 变为 `WorkbenchLayout`

## 数据流与错误处理

- 本轮无新 API、无 Layout 级全局状态
- 接口错误逻辑不变（首页 `useRequest`、正则 CRUD 等）
- 未知路径：由 MainLayout 下 `*` → NotFound
- `/workbench` 下本轮不单独挂 404 子路由；日后子路由增多再补
- `/blank` 不进主导航

## 跨壳跳转

- MainLayout 顶栏「工作台」→ `/workbench`
- WorkbenchLayout 内提供回到 `/` 的入口
- 本轮不做统一菜单配置或跨壳状态同步

## 验收（手工）

1. Home ↔ 正则设置：仍为顶栏壳
2. 进入工作台：见侧栏壳；页面业务文案与改前一致
3. 未知 URL：404（MainLayout）
4. 直接访问 `/blank`：见「BlankLayout 挂点」占位，且无 MainLayout 顶栏
5. `/workbench`、`/blank` 不会误落入 MainLayout 404
6. 子路径部署相关的 `basename` 行为未回归

## 风险与约束

- History 模式生产部署仍需未知路径回退 `index.html`（既有约束）
- MainLayout 的 `*` 与 `/workbench`、`/blank` 兄弟分支并存时，需确认 react-router 匹配顺序：业务 path 由对应分支承接，未匹配落 MainLayout 404
- `/blank` 为内部挂点，勿加入主导航，避免用户误入空页

## 修订记录

- 2026-08-03：初稿。多 Layout 兄弟分支；Main / Workbench / Blank；Workbench 业务不改。
- 2026-08-03：实现完成（三 Layout 兄弟分支；删除 App 根 Layout）。
