---
name: vitest-pure-fn
description: >-
  Use when 在 Vite+React+TS 脚手架中新增/修改纯函数、补 Vitest 单测、
  feature 完成前验证、或问测试策略。绑定 Vitest Node 环境。
---

# Vitest 纯函数测试（日常 Skill）

## Overview

本 Skill 约定 **Vite + React + TypeScript** 脚手架下的纯函数 Vitest 工作流，与 **`api-request`**、**`module-file-layout`** 同级——**直接位于 `.cursor/skills/`，无需安装包即可 invoke**。

绑定 **Vitest（Node）**；不测组件 DOM（默认无 jsdom/RTL）。

**Violating the letter of the rules is violating the spirit of the rules.**

### 与 kit 的关系

| 类型 | 路径 | 作用 |
| --- | --- | --- |
| **本 Skill** | `.cursor/skills/vitest-pure-fn/SKILL.md` | 日常 workflow |
| **kit（可选）** | `.cursor/templates/vitest-pure-fn-kit/` | 仅 **初始化**：空索引表、vitest.config、Rule、docs/test |

新仓若尚未装 Vitest 层，按 kit 的 **README.md** 按需复制；**不要**从 kit 安装本 SKILL.md。

### 测试金字塔

```text
lint → test → build

Vitest：纯函数 / 解析 / 匹配 / 转换
docs/test：接口 + 浏览器人工（不默认 Playwright）
```

Rule：**vitest-conventions**、**verify-after-edit**。

---

## When to Use

- 新增/修改 `src/**/*.ts` 纯逻辑
- 补单测、跑 test、feature 收尾
- 问「要不要测、放哪」

## When NOT

- 仅改 `*.tsx` → `css-module-less`
- 仅改 API → `api-request`
- 仓内尚无 `vitest.config.ts` → 先按 **vitest-pure-fn-kit** README 安装

---

## Iron Law

```text
NO 纯函数行为变更 WITHOUT __tests__ 同步
NO 声称完成 WITHOUT yarn test（相关文件至少跑过）
NO 为测试污染业务代码
```

---

## Step 1：判定纯函数

| # | 条件 |
| --- | --- |
| 1 | 相同输入 → 相同输出 |
| 2 | 无副作用（DOM/网络/文件/外部 state） |
| 3 | Node 可直接 import |

项目已测模块：**[reference.md](reference.md) 项目单测索引**。策略：`docs/test/strategy.md`。

---

## Step 2：落盘（`__tests__/` 方案 B）

```text
<ModuleDir>/
├── myLogic.ts
└── __tests__/myLogic.test.ts
```

---

## Step 3–4：编写与验证

见 Rule `vitest-conventions`；`yarn vitest run …` → `yarn lint` → 必要时 `yarn build`。

---

## 自检

- [ ] 纯函数？`__tests__` 已同步？
- [ ] `yarn test` 通过？
- [ ] **reference.md 项目单测索引** 已更新？
- [ ] 未加 testid / E2E 注入 / Playwright？

kit 索引：`.cursor/templates/vitest-pure-fn-kit/INDEX.md`  
脚手架总索引：`.cursor/templates/README.md`
