# sync-design-plan 跨项目模板

superPowers 工作流下，代码变更后同步回写 `design` + `plan` 的 Rule + Skill 模板。**无业务绑定**，可复制到任意采用 superPowers 规范的项目。

## 安装（新项目）

```bash
# 在项目根目录执行
mkdir -p .cursor/rules .cursor/skills/sync-design-plan
cp .cursor/templates/sync-design-plan/sync-design-plan.mdc .cursor/rules/
cp .cursor/templates/sync-design-plan/SKILL.md .cursor/skills/sync-design-plan/
cp .cursor/templates/sync-design-plan/reference.md .cursor/skills/sync-design-plan/
```

若从本仓库外复制，将 `templates/sync-design-plan/` 下三个文件按上表路径放入目标项目即可。

## 安装后必改项

| 文件 | 配置项 | 说明 |
|------|--------|------|
| `sync-design-plan.mdc` | `globs` | 按目标项目代码目录调整（见下表） |
| `sync-design-plan.mdc` | 修订记录章节 | 若 design 模板无 §11.4/§11.5，改为该项目约定章节名 |
| `SKILL.md` | `description` 中的路径 | 与 `globs` 一致 |
| `reference.md` | `代码根路径` | 默认 `src/pages/`，可改为 `src/views/` 等 |
| `reference.md` | `例外表` | 保持为空；仅当约定搜不中时追加 |
| `reference.md` | `命名惯例` | 按团队文档 slug 习惯微调 |

### globs 常见变体

| 项目类型 | 建议 globs |
|----------|------------|
| Umi / React（本仓库） | `src/pages/**`, `src/services/**`, `src/locales/**` |
| Vue | `src/views/**`, `src/api/**`, `src/locales/**` |
| Monorepo | `apps/<app>/src/**`, `packages/**` |
| 始终需要 | `docs/superpowers/**` |

## 与项目 Skill 的关系

- **本模板**：只管 design/plan ↔ 代码同步，不含 CRUD、API、UI 组件等项目规范。
- **项目 Skill**（如 `ly-jcsj-crud-template`）：按技术栈单独编写，与本文档并列使用。

## 文件清单

```
.cursor/templates/sync-design-plan/
├── README.md              # 本说明
├── sync-design-plan.mdc   # → 复制到 .cursor/rules/
├── SKILL.md               # → 复制到 .cursor/skills/sync-design-plan/
└── reference.md           # → 复制到 .cursor/skills/sync-design-plan/
```

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-06-08 | 初版：从 ly-cea-pjxt-jcsj-ui 抽离无项目绑定模板 |
