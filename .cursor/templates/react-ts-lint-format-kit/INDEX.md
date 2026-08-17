# react-ts-lint-format-kit 安装包索引

> 本 kit 仅含 **需初始化落盘** 的配置与可选 hook；**无 init Skill**。  
> 安装步骤见 [README.md](./README.md)。日常改完验证见 Rule **`verify-after-edit`**（脚手架 `.cursor/rules/`，非本 kit 必装项）。

## 包结构

```text
react-ts-lint-format-kit/
├── INDEX.md              ← 本文件
├── README.md             ← 安装参考（按需手工/AI 执行）
├── files/                → 仓库根
└── optional/
    └── cursor-format-hook/   → .cursor/hooks（opt-in）
```

## files/ → 仓库根

| 模板 | 落地 |
| --- | --- |
| `files/eslint.config.mjs` | `eslint.config.mjs` |
| `files/.prettierrc.cjs` | `.prettierrc.cjs` |
| `files/.prettierignore` | `.prettierignore` |
| `files/.editorconfig` | `.editorconfig` |

## optional/

| 模板 | 落地 |
| --- | --- |
| `optional/cursor-format-hook/format-after-edit.cmd` | `.cursor/hooks/` |
| `optional/cursor-format-hook/format-after-edit.mjs` | `.cursor/hooks/` |
| `optional/cursor-format-hook/hooks.json` | `.cursor/hooks.json`（无则复制；有则合并） |

## package.json（README 内合并）

- devDependencies：eslint、prettier、typescript-eslint 等（见 README §依赖）
- scripts：`lint`、`lint:fix`、`format`、`format:check`

## 引用关系

```text
react-ts-lint-format-kit (README)   按需安装 ESLint/Prettier/EditorConfig
        │
        └── 日常：yarn lint / format:check；Rule verify-after-edit
```

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-08 | 初版（原 react-ts-lint-format-init） |
| 2026-08-17 | 重命名为 kit；去掉 init Skill；安装流程并入 README |
