# 正则设置页 API 联调 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/regex-settings` 从 `src/apis/regex/**` mock 切换为真实 `/regexRules` CRUD。

**Architecture:** 按 URL 镜像新建 `src/apis/regexRules/**`，字段与后端 Vo/Dto 对齐；列表将 IPage 转为 `PageResult`；启停复用 update；删除旧 mock 并改页面 import。

**Tech Stack:** React 19、antd 6、ahooks、`@/utils/request`、`workbench-api-request` 模板。

**Spec:** `docs/superpowers/specs/2026-08-04-regex-settings-api-integration-design.md`

---

## File Structure

| 路径 | 职责 |
|------|------|
| `src/apis/types.ts` | `ResponseStructure` 增加可选 `message` |
| `src/apis/regexRules/types.ts` | 规则类型、启停常量、筛选项、写参 |
| `src/apis/regexRules/query/index.ts` | `GET /regexRules/query` |
| `src/apis/regexRules/insert/index.ts` | `POST /regexRules/insert` |
| `src/apis/regexRules/update/index.ts` | `POST /regexRules/update` |
| `src/apis/regexRules/delete/index.ts` | `POST /regexRules/delete` |
| `src/pages/RegexSettings/index.tsx` | 改字段与 API |
| `src/apis/regex/**` | 删除 |

---

### Task 1: 公共类型 + regexRules types

**Files:**
- Modify: `src/apis/types.ts`
- Create: `src/apis/regexRules/types.ts`

- [x] **Step 1:** `ResponseStructure` 增加 `message?: string`（保留 `msg?`）
- [x] **Step 2:** 定义 `RegexRuleEnableStatus`、`RegexRule`、列表筛选项与写操作入参

Expected: 类型可被后续 API 引用，无 `enum`。

---

### Task 2: 四个 API 函数

**Files:**
- Create: `src/apis/regexRules/query|insert|update|delete/index.ts`

- [x] **Step 1:** `RegexRulesQueryApi(page, form)` → GET，`page`←`current`，IPage→`PageResult`
- [x] **Step 2:** `RegexRulesInsertApi` / `UpdateApi` / `DeleteApi` 按模板；错误用 `message ?? msg`

Expected: 符合 `workbench-api-request`；无 mock/store。

---

### Task 3: 页面改造 + 删除 mock

**Files:**
- Modify: `src/pages/RegexSettings/index.tsx`
- Delete: `src/apis/regex/**`

- [x] **Step 1:** 改 import、表单/列/筛选为后端字段；启停调 update；删除传 `ids`
- [x] **Step 2:** 删除 `src/apis/regex` 整目录
- [x] **Step 3:** `npx tsc -b --pretty false`（本改动无新增错误）

Expected: 无 `@/apis/regex` 引用；页面文案不再提 mock。

---

### Task 4: 文档同步

**Files:**
- Modify: `docs/superpowers/specs/2026-07-31-regex-settings-antd-crud-design.md`（修订记录指向联调）
- Modify: `docs/superpowers/plans/2026-07-31-regex-settings-antd-crud.md`（文末注意点）
- Modify: 本 design/plan 勾选完成项

- [x] **Step 1:** 旧 design/plan 追加修订：API 以 `2026-08-04-regex-settings-api-integration` 为准
- [x] **Step 2:** 本 plan Task 勾选完成

Expected: design + plan 成对更新。

---

## 已知实现注意点

- 后端成功码 200；失败多为 500 + `message`（业务 409/422 等若进 Result 仍看 code/message）
- 前端 Switch 用 `getValueProps` / `getValueFromEvent` 与 `enableStatus` 0|1 互转
- 不提交 git（用户要求人工 review 后再提交）
