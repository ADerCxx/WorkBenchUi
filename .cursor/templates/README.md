# 脚手架模板索引

`.cursor/templates/` 存放 **可选安装包（kit）**：供新仓按需复制**需初始化落盘**的文件。不是「一键装全家桶」。

## kit 与 skill 的分工

| 类型 | 位置 | 何时需要 |
| --- | --- | --- |
| **Skill** | `.cursor/skills/<name>/SKILL.md` | 约定与 workflow；**直接随脚手架提供**，无需 kit |
| **kit** | `.cursor/templates/<name>-kit/` | 配置文件、空索引表、占位文档等 **首次落盘** |

**不需要 kit 的 Skill**：`api-request`、`module-file-layout`、`css-module-less` 等（无初始化落盘内容）。

**需要 kit 的示例**：

| kit | 初始化内容 |
| --- | --- |
| `react-ts-lint-format-kit` | ESLint / Prettier / EditorConfig；可选 format hook |
| `vitest-pure-fn-kit` | Vitest 配置、测试 Rule、空 `reference.md` 索引表、`docs/test/` |

kit **不含 init Skill**；安装步骤在各自 **README.md**。日常 invoke 配套 Skill 或 Rule（如 `vitest-pure-fn`、`verify-after-edit`）。

## 可选安装包一览

| kit ID | 目录 | 安装产物（摘要） | 日常约束 |
| --- | --- | --- | --- |
| `react-ts-lint-format-kit` | [react-ts-lint-format-kit](./react-ts-lint-format-kit/) | ESLint / Prettier / EditorConfig；可选 hook | Rule `verify-after-edit` |
| `vitest-pure-fn-kit` | [vitest-pure-fn-kit](./vitest-pure-fn-kit/) | Vitest、Rule、`reference.md` 空表、`docs/test/` | Skill `vitest-pure-fn` |

## 使用方式（按需）

1. 确认需要该能力
2. 打开 kit 的 **README.md**，按步骤复制 `files/`、`optional/`
3. 有索引表的 kit：用空表初始化后再填写（如 Vitest `reference.md`）
4. 日常开发用 **Skill / Rule**，不从 kit 重复安装

## 真源与落地副本

| 真源 | 落地 |
| --- | --- |
| `templates/<kit>/files/` | 仓库根 |
| `templates/<kit>/optional/` | 按需 |
| `.cursor/skills/*.md` | 脚手架内直接维护 |

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-17 | react-ts-lint-format 改为 kit 模式；统一 kit/skill 分工说明 |
