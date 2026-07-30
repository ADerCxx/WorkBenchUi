# WorkBench 路由脚手架设计

日期：2026-07-30  
状态：已确认（待实现）

## 目标

为 WorkBench（Vite + React）补齐客户端路由，使其成为可多页面跳转的 SPA 脚手架。不改业务 API，不重做 UI。

### 成功标准

- `/`、`/demo` 支持客户端跳转；未知路径进入 404
- `basename` 与 Vite `base`（`import.meta.env.BASE_URL`）对齐，子路径部署时主要改 `vite.config` 的 `base`
- 现有欢迎页 + 请求示例仍在首页可用

## 非目标

- 不做路由懒加载、`loader`/`action`
- 不做权限路由、菜单配置中心
- 不改 Nginx/生产 rewrite 文档以外的部署工程（仅在实现说明中提示 History 模式需回退到 `index.html`）

## 技术方案

- 依赖：新增 `react-router-dom`（与当前 React 19 兼容的大版本）
- API：`createBrowserRouter` + `RouterProvider`（History 模式）
- `basename`：由 `import.meta.env.BASE_URL` 推导（去掉尾部 `/`；根路径为空或按库约定处理），与 Vite `base` 联动
- Vite `base`：当前保持默认 `'/'`；日后子路径部署改为如 `'/workbench/'` 即可

## 目录结构

```
src/
  main.tsx                 # 挂载 RouterProvider
  App.tsx                  # 根 Layout：简单导航 + Outlet
  App.less                 # Layout 样式（若需要极简导航样式）
  router/
    index.tsx              # createBrowserRouter 路由表
  pages/
    Home/
      index.tsx            # 由现有 App 业务内容迁入
      index.less           # 现有 App.less 整文件迁入（首页专用）
    Demo/
      index.tsx            # 极简示例页
    NotFound/
      index.tsx            # 404
```

说明：现有 `App.less` 随首页迁到 `pages/Home/index.less`。Layout 导航若需样式，新建极简规则（可写在 `App.less` 或内联 class），不与首页样式混用。

## 路由表

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Layout → Home | 现有欢迎页 + 请求示例 |
| `/demo` | Layout → Demo | 极简示例，含返回首页链接 |
| `*` | Layout → NotFound | 未知路径 |

嵌套关系：根 route `element: <App />`（Layout），`children` 为上述三个页面；子路由通过 `<Outlet />` 渲染。

## 数据流与错误处理

- `main.tsx` 只负责 `StrictMode` + `RouterProvider`，不再直接渲染整页业务内容
- Layout（`App`）提供顶部 `Link`（首页、Demo）与 `<Outlet />`
- 页面同步 import，暂不 `lazy` / `Suspense`
- 路由级：仅 404；接口错误仍由首页现有 `useRequest` 逻辑处理

## 实现要点

1. 安装 `react-router-dom`
2. 新增 `src/router/index.tsx` 导出 `router`
3. 将现有 `App.tsx` 业务 JSX/状态迁入 `pages/Home`；`App.tsx` 改为 Layout
4. 新增 `Demo`、`NotFound` 页面
5. 更新 `main.tsx` 使用 `RouterProvider`
6. 本机验证：导航 Link、直接访问 `/demo`、访问未知路径、刷新页面仍由 Vite 正确返回前端（dev 已支持）

## 风险与约束

- History 模式生产部署需服务器对未知路径回退到 `index.html`；本脚手架不改服务器配置
- `BASE_URL` 与 `basename` 尾部斜杠处理不一致会导致子路径下匹配失败，实现时需按 react-router 文档规范化
