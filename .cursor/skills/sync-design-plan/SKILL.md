---
name: sync-design-plan
description: >-
  superPowers 模块代码变更后同步回写 design 与 plan 文档。在实现/修改 src/pages、
  src/apis、src/router 业务代码、执行 plan Task、用户微调需求或 UI、实现与文档不一致、
  或用户要求同步 design/plan 时使用。须与 .cursor/rules/sync-design-plan.mdc 一并遵守。
---

# superPowers：design 与 plan 文档同步

> Rule（`.cursor/rules/sync-design-plan.mdc`）在编辑 globs 匹配路径时自动注入硬约束；本 Skill 提供**完整工作流与文档定位约定**（实现 superPowers 模块时亦应主动读取）。

## 同步工作流

```
改代码前/同时  →  打开 design + plan
       ↓
比对差异  →  列出 design 哪些章节、plan 哪些 Task 与将要做的不一致
       ↓
改代码  →  保持最小 diff
       ↓
改文档  →  design + plan（见下方分工表）
       ↓
修订记录  →  design 文末修订章节或 plan 末尾追加（日期 + 摘要）
       ↓
回复用户  →  说明已同步的文档路径与变更点
```

## design 与 plan 分工

| 文档 | 更新内容 |
|------|----------|
| **design** | 产品决策表、UI 交互表、数据模型、实现要点、验收标准、修订记录；版本号可递增（如 V1.1 → V1.2） |
| **plan** | Task 内代码示例、`Expected` 验收句、文件清单、「已知实现注意点」；与 design 冲突时 **以 design 为准** |

**禁止**：只改 plan 不改 design（决策级变更必须在 design）；只改 design 不改 plan（可执行步骤/代码片段必须在 plan 体现）。

## 文档定位步骤

1. 从改动路径推断模块（取业务代码目录的叶子文件夹名）。
2. **主路径**：叶子目录名 → kebab-case → 在 `docs/superpowers/specs/`、`plans/` 搜索（详见 [reference.md](reference.md)「主路径」）。
3. **例外**：约定猜不中时查 [reference.md](reference.md)「例外表」（仅维护非显然映射，不维护全量索引）。
4. 若找不到文档，询问用户或说明「无 superPowers 文档，跳过同步」。

## 常见漏同步原因

1. 只跟 plan Task 改代码，用户后续微调未回写 design。
2. Subagent 执行 Task 后未在主会话收尾同步文档。
3. 未从代码路径反查 `docs/superpowers/` 下对应文件。
4. 决策级变更只更新了 plan，未更新 design。
5. 一模块多文档（如静态页 vs API 联调）时只同步了其中一份。

## 定位示例（泛化）

假设代码在 `<代码根路径>/userProfile/`，文档 slug 为 `user-profile`：

- Design：`docs/superpowers/specs/YYYY-MM-DD-user-profile-design.md`
- Plan：`docs/superpowers/plans/YYYY-MM-DD-user-profile.md`

日期前缀以仓库内实际文件为准。

## 命名约定与例外

见 [reference.md](reference.md)。
