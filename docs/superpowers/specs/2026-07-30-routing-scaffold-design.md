# WorkBench 路由脚手架设计

日期：2026-07-30  
状态：已实现（2026-07-31 修订：业务路由；2026-08-03 修订：多 Layout 兄弟分支）

## 目标

为 WorkBench（Vite + React）补齐客户端路由，使其成为可多页面跳转的 SPA 脚手架。不改业务 API，不重做 UI。

### 成功标准

- `/`、`/workbench`、`/regex-settings` 支持客户端跳转；未知路径进入 404
- `basename` 与 Vite `base`（`import.meta.env.BASE_URL`）对齐，子路径部署时主要改 `vite.config` 的 `base`
- 现有欢迎页 + 请求示例仍在首页可用

## 非目标

- 不做路由懒加载、`loader`/`action`
- 不做权限路由、菜单配置中心
- 不改 Nginx/生产 rewrite 文档以外的部署工程（仅在实现说明中提示 History 模式需回退到 `index.html`）
- 正则设置页 CRUD 详见 `2026-07-31-regex-settings-antd-crud-design.md`；真实接口联调见 `2026-08-04-regex-settings-api-integration-design.md`（本规格仅定义路由挂载）

## 技术方案

- 依赖：`react-router-dom`（与当前 React 19 兼容的大版本）
- API：`createBrowserRouter` + `RouterProvider`（History 模式）
- `basename`：由 `import.meta.env.BASE_URL` 推导（去掉尾部 `/`；根路径为空或按库约定处理），与 Vite `base` 联动
- Vite `base`：当前保持默认 `'/'`；日后子路径部署改为如 `'/workbench/'` 即可

## 目录结构

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

## 路由表

| 路径 | Layout | 页面 | 说明 |
|------|--------|------|------|
| `/` | MainLayout | Home | 现有欢迎页 + 请求示例 |
| `/regex-settings` | MainLayout | RegexSettings | 正则白名单设置（Antd 管理页，对接 `/regexRules`） |
| `*`（MainLayout 下） | MainLayout | NotFound | 未知路径 |
| `/workbench` | WorkbenchLayout | Workbench | 工作台占位页 |
| `/blank` | BlankLayout | BlankPlaceholder | 预留挂点，详见 `2026-08-03-multi-layout-design.md` |

嵌套关系：`createBrowserRouter` 下并列三个 Layout 兄弟分支（MainLayout / WorkbenchLayout / BlankLayout），各自 `children` 挂业务页；子路由通过 `<Outlet />` 渲染。原单一 `App` 根 Layout 已删除。

已移除：`/demo`（Demo 示例页）；`App.tsx` / `App.less`（2026-08-03 多 Layout 重构）。

## 数据流与错误处理

- `main.tsx` 只负责 `StrictMode` + `ConfigProvider` + `RouterProvider`
- `MainLayout` 提供顶部 `Link`（首页、工作台、正则设置）与 `<Outlet />`；`WorkbenchLayout` / `BlankLayout` 各自负责壳 UI 与 `<Outlet />`
- 页面同步 import，暂不 `lazy` / `Suspense`
- 路由级：MainLayout 下 `*` → NotFound；接口错误仍由首页现有 `useRequest` 逻辑处理
- 正则设置页为 Antd 管理页，数据经 `src/apis/regexRules/**` 对接后端（见 `2026-08-04-regex-settings-api-integration-design.md`）

## 实现要点

1. 已安装 `react-router-dom`
2. `src/router/index.tsx` 导出 `router`
3. Layout 导航指向业务路由
4. 工作台仅占位；正则设置页为 Antd CRUD（筛选、分页、新建/编辑/删除、行内启停），数据对接 `/regexRules`

## 风险与约束

- History 模式生产部署需服务器对未知路径回退到 `index.html`
- `BASE_URL` 与 `basename` 尾部斜杠处理不一致会导致子路径下匹配失败

## 修订记录

- 2026-07-31：移除 Demo；新增 `/workbench`、`/regex-settings`；顶栏导航同步更新。
- 2026-07-31：正则页升级为 Antd CRUD Demo（见 `2026-07-31-regex-settings-antd-crud-design.md`）。
- 2026-08-03：根 Layout 拆为 MainLayout / WorkbenchLayout / BlankLayout 兄弟分支；详见 `2026-08-03-multi-layout-design.md`。`App.tsx` 已删除。
