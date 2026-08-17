# 测试策略（WorkBench / Fabric）

本仓测试策略见 `docs/test/strategy.md`；日常 invoke Skill **`vitest-pure-fn`**；空项目安装见 **`.cursor/templates/vitest-pure-fn-kit/README.md`**。

## 金字塔

| 层级 | 方式 | 门禁 |
| --- | --- | --- |
| 静态 | `yarn lint`、`yarn build` | 每次提交 / CI（可选） |
| 单元 | Vitest + Node，纯函数，`__tests__/` | 每次提交 |
| 接口 | `docs/test/Fabric_全流程测试_*.md` | 联调 / 发版 |
| 浏览器 UI | 人工 + `docs/test/fixtures/fabric-e2e` | 发版 |

## Vitest 范围

**测**：解析、匹配、树构建、SSE 数据解析、图谱 JSON、路径/几何/文案等纯函数。

**不测**：

- React 组件、hooks（`useAnalysisStream`）
- File System Access（`pickProjectRoot`、`scanByWhitelist`）
- axios 封装本身

## 产品约束

- 无 `data-testid`、无 `window.__FABRIC_E2E__`（Playwright 方案已撤销）
- 不默认 jsdom / Playwright

## 完成前验证

```text
yarn lint → yarn test → yarn build（涉及类型/构建时）
```

Rule：`vitest-conventions`、`verify-after-edit`。

## 纯函数判定

1. 相同输入 → 相同输出  
2. 无副作用  
3. Node 可直接 import  

## 项目单测清单

维护于 `.cursor/skills/vitest-pure-fn/reference.md`。

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-17 | 与 vitest-pure-fn-kit 对齐 |
