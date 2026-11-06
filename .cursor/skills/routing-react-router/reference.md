# React Router 路由 — 本仓取值（确定值）

换项目时只改本表；硬规则（三条路由规则、区域兜底、Lazy 策略）不变。

## 技术栈

| 项 | 取值 |
| --- | --- |
| React | 19.2.x |
| 路由库 | **react-router-dom v7.18.2** |
| 路由形态 | 数据路由：`createBrowserRouter` + `<RouterProvider>` |
| 是否已安装 | ✅ 已安装（项目初始即带） |
| TypeScript | 严格模式；`handle` 用 `satisfies RouteMeta` 做类型收敛 |

## 路径与别名

| 项 | 取值 |
| --- | --- |
| router 根 | `src/router/` |
| 布局 | `src/layouts/XxxLayout/` |
| 页面 | `src/pages/Xxx/` |
| 路径别名 | `@/` → `src/` |
| basename | 由 Vite `BASE_URL` 推导（去尾斜杠；根路径不传），见 `src/router/index.tsx` |
| 站点名（title 后缀） | `Fabric`，拼成 `标题 · Fabric` |

## 现有路由区域

| 区域路径 | 布局 | 页面 | 备注 |
| --- | --- | --- | --- |
| `/` | `MainLayout` | Home（index）、RegexSettings | 主站：Logo + 导航 + CTA |
| `/workbench` | `BlankLayout` | Workbench（index） | 全屏工作台 |
| `/blank` | `BlankLayout` | BlankPlaceholder（index） | 占位页 |
| `*`（根级） | — | NotFound | 安全网，理论上不可达 |

> 历史记录：`src/layouts/WorkbenchLayout/` 曾存在但从未被路由引用（死代码），已于 2026-11-05 删除。
> 工作台布局就是 `BlankLayout`，不需要额外的工作台专用布局。

## 文件清单（本 skill 改造后的落盘）

| 文件 | 状态 | 职责 |
| --- | --- | --- |
| `src/router/index.tsx` | 改写 | 仅创建 router 实例 + basename |
| `src/router/routes.tsx` | 新增 | 路由表本体 |
| `src/router/paths.ts` | 新增 | 路径常量 |
| `src/router/types.ts` | 新增 | `RouteMeta` 类型 |
| `src/router/menu.ts` | 新增 | 主站菜单数据 |
| `src/router/MetaSync/index.tsx` | 新增 | title 同步 + 最外层 Suspense |
| `src/router/RouteFallback/index.{tsx,less}` | 新增 | 懒加载占位（`FabricLoading`） |
| `src/pages/RouteError/index.{tsx,less}` | 新增 | 路由级错误兜底页 |
| `src/layouts/MainLayout/index.tsx` | 改写 | 加 Suspense、菜单改数据驱动、用 PATHS |
| `src/layouts/BlankLayout/index.tsx` | 改写 | 加 Suspense |
| `src/router/index.less` | 删除 | 内容迁入 `RouteFallback/index.less` |

## 数据流：本仓不使用 loader / action

v7 支持 loader/action 做路由级数据预取，本仓**不启用**：
取数统一在页面 hooks 里调用 `src/apis`（见 `api-request`），
好处是与请求层单一入口保持一致，避免"两条取数路径"。

若将来需要「进入页面前必须拿到数据」的强保证，再评估引入 loader，届时需同步调整：
`errorElement` 要处理 loader 抛错、`RouteError` 的 `isRouteErrorResponse` 分支就有了用武之地。

## 未启用的能力

| 能力 | 状态 | 启用时机 |
| --- | --- | --- |
| `loader` / `action` | 不启用 | 需要路由级数据预取时 |
| 权限守卫 | 不启用（无登录态） | 接入鉴权时，步骤见 SKILL.md「权限守卫」 |
| 面包屑 | 未做 | 路由层级 ≥ 3 层且产品需要时，基于 handle 扩展 |
| 滚动恢复 | 未做 | 长列表页返回需保持位置时，加 `ScrollRestoration` |
| 路由过渡动画 | 未做 | 产品明确要求时 |

## 验证方式

本仓 vitest 配置 `environment: 'node'`、`include: src/**/__tests__/**/*.test.ts`。
需要验证路由归属时可用纯逻辑脚本：

```ts
import { matchRoutes } from 'react-router-dom';
matchRoutes(routes, '/workbench/xxx'); // handle 在 match.route.handle
```

注意 `matchRoutes`（纯逻辑）与 `useMatches`（组件内）的 handle 取值位置不同，
详见 SKILL.md「元数据」一节的对照表。
