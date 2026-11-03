# Zustand 状态管理 — 本仓取值（确定值）

换项目时只改本表；硬规则（store 结构、选择器粒度、不可变更新）不变。

## 技术栈

| 项 | 取值 |
| --- | --- |
| React | 19.2.x |
| 状态管理 | **zustand v5**（v5 要求 React 18+，本仓满足，无需 `use-sync-external-store` shim） |
| 是否已安装 | ⚠️ 未安装，首次建 store 前执行 `yarn add zustand` |
| TypeScript | 严格模式，`Type` 与 action 签名分离到 `types.ts` |

## 路径

| 项 | 取值 |
| --- | --- |
| store 根 | `src/stores/` |
| 路径别名 | `@/` → `src/` |
| 单测 | 与 store 同目录 `__tests__/` 或就近，写法见 `vitest-pure-fn` |

## 中间件启用情况

| 中间件 | 状态 | 说明 |
| --- | --- | --- |
| `persist` | 按需 | 仅用于用户偏好，必须配 `partialize` + `version` |
| `devtools` | 按需 | 本地调试时可包，不强制 |
| `immer` | 不启用 | 优先扁平 state + 展开更新；嵌套确实深时再评估 |
| `subscribeWithSelector` | 不启用 | 需要 selector 形式 `subscribe` 时再装 |

## 本仓标杆

暂无（本仓当前未建任何 store，全项目为 `useState` + props + 自定义 hook）。  
首个 store 落地后，在此补一行标杆路径，例如：

| 说明 | 路径 |
| --- | --- |
| 首个 store（示例） | 待建 — `src/stores/useWorkbenchStore/{index.ts,types.ts}` |

## 迁移提示（React 16/17 → 19 时）

若 store 从旧 React 项目迁入：v5 已移除默认导出与 `create` 的旧等式比较参数，需改为 `create<T>()(...)` 并显式加 `useShallow`；旧 `equalityFn` 写法在 v5 会静默失效。
