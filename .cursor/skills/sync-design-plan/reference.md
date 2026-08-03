# superPowers 文档定位参考

真源在 `docs/superpowers/`。本文件只记录**命名约定**与**无法靠约定猜到的例外**；不做全量模块索引。

> **代码根路径**（WorkBench）：`src/pages/`；路由表改动对应 `src/router/`，接口对接对应 `src/apis/`（叶子目录或 URL 镜像路径 → kebab-case 关键词后在 docs 搜索）。

## 主路径：从代码路径搜索文档

1. 取**代码根路径**下**叶子目录名**（如 `userProfile`、`orderManage`）。
2. 转为 kebab-case 关键词（`user-profile`、`order-manage`）。
3. 在 `docs/superpowers/specs/`、`plans/` 下按关键词搜索（Glob 或 grep）：
   - Design：`specs/*<关键词>*-design.md`
   - Plan：`plans/*<关键词>*.md`（文件名通常不含 `-design`）
4. 日期前缀 `YYYY-MM-DD-` 以仓库内实际文件为准，搜索时忽略日期。
5. 若同时命中多份，按本次改动范围选择（见下文「一模块多文档」）。

**示例**：`<代码根路径>/userProfile/` → 搜 `user-profile` → 命中对应 design 与 plan。

## 命名惯例（先搜这些变体）

| 代码目录特征 | 文档 slug 常见形式 |
|-------------|-------------------|
| `*Manage` | `*-management-*` 或 `*-static-page(s)` |
| `*Info` / `*Information` | 常为 `*-info-*` 或 `*-static-pages` |
| 联调阶段 | 后缀 `*-api-integration` 或 `*-api-refinement` |
| 前端专项 | 后缀 `*-frontend` |
| 脚手架 / 路由 | `*-scaffold`、`*-routing-*` |

先搜主关键词；无结果时再叠加上表后缀组合。团队若有固定 slug 规则，在本表补充一行即可。

## 例外表（仅「约定猜不中」时查）

新增模块时，**仅当**代码目录名与文档 slug 明显对不上，才在本表追加一行。

| 代码路径片段 | 应搜的文档关键词 | 备注 |
|-------------|-----------------|------|
| `src/router` / `src/pages/{Home,Workbench,RegexSettings,NotFound}` | `routing-scaffold` | 路由脚手架一对 design/plan，非单页一一对应 |

路径均相对于 `docs/superpowers/`。

## 一模块多文档

同一业务模块可能有多对 design/plan，按**本次改动**同步对应文档：

| 关键词 | 典型场景 |
|--------|----------|
| `*-static-page(s)` | 静态页 / 初版 UI |
| `*-api-integration` | 接口联调、service 对接 |
| `*-api-refinement` | 接口字段/行为细化 |

## 找不到时

1. 扩大关键词（去掉 `Manage`/`Info` 等后缀再搜）。
2. 仍无结果 → 询问用户或说明「无 superPowers 文档，跳过同步」。
