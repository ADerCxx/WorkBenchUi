# 测试策略

本仓为 **Vite + React + TypeScript** 脚手架；测试分层如下。

## 金字塔

| 层级 | 方式 | 门禁 |
| --- | --- | --- |
| 静态 | `yarn lint`、`yarn build`（tsc） | 每次提交 / CI |
| 单元 | Vitest + Node，纯函数 | 每次提交 / CI |
| 接口 | `docs/test/` 脚本或文档化实测 | 联调 / 发版 |
| 浏览器 UI | 人工勾验 + `docs/test/fixtures/` | 发版 |

## Vitest 范围

**测**：纯函数（解析、匹配、转换、几何、文案等）→ 同模块 `__tests__/*.test.ts`。

**不测**（除非日后显式开启 jsdom/RTL）：

- React 组件 `*.tsx`
- hooks 状态机、SSE 页面流
- File System Access、目录选择
- axios 封装本身（接口走 `docs/test`）

## 产品约束

- 不为测试改业务代码：无 `data-testid`、无 `window.__*_E2E__` 注入缝
- 不默认引入 Playwright / Cypress 全路径 E2E

## 完成前验证（Agent / 开发者）

```text
yarn lint → yarn test → yarn build（涉及类型/构建时）
```

详见 `.cursor/skills/vitest-pure-fn/` 与 Rule `vitest-conventions`。

## 纯函数判定（摘要）

1. 相同输入 → 相同输出  
2. 无副作用（DOM / 网络 / 文件 / 外部可变状态）  
3. Node 中可直接 import 调用  

## 项目单测清单

维护于 `.cursor/skills/vitest-pure-fn/reference.md` 的「项目单测索引」表。

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-17 | 初版：vitest-pure-fn-kit |
