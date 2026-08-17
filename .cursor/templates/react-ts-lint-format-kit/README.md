# react-ts-lint-format-kit 安装参考

在 **React + TypeScript** 仓库**按需**启用 ESLint 9 Flat + Prettier 3 + EditorConfig。  
**不是**必装模块；**无** init Skill——按本文复制 `files/` 或让 AI 参照本文执行。

**实现栈**：ESLint 9 Flat + Prettier 3；**禁止** `@umijs/lint`。不含 Husky / lint-staged。

文件清单：[INDEX.md](./INDEX.md)

---

## 适用 / 不适用

**适用**：Vite / CRA / Next / Rsbuild 等 React + TS 仓。  
**不适用**：Vue/Svelte 为主、用户禁止改 lint、已用 Biome/oxlint 且要求保留。  
**非目标**：Stylelint、Husky、commitlint、全仓 lint:fix（未经同意）。

---

## 0. 复制 kit 到 templates（跨项目时）

```powershell
Copy-Item -Recurse -Force `
  <脚手架源>\.cursor\templates\react-ts-lint-format-kit `
  .cursor\templates\
```

**KIT_ROOT** = `.cursor/templates/react-ts-lint-format-kit`

---

## 1. 执行前探测（必须先做）

向用户汇报后再写文件；有冲突**先问**，禁止静默覆盖：

1. 包管理器（yarn / npm / pnpm）
2. 是否已有 eslint / prettier / editorconfig / cursor hooks
3. `tsconfig`、React 版本、源码目录（`src/` 等）

| 情况 | 做法 |
| --- | --- |
| 无配置 | 全套安装 |
| 有配置且用户同意对齐 | 备份后替换/合并 |
| 有配置用户未表态 | **停止**，请用户选择 |
| ESLint 8 + `.eslintrc` | 说明升级 Flat；避免双轨 |

---

## 2. 安装依赖

**必装 devDependencies**：

```text
eslint @eslint/js typescript-eslint eslint-plugin-react
eslint-plugin-react-hooks eslint-config-prettier globals
prettier prettier-plugin-organize-imports
```

```powershell
# yarn 示例
yarn add -D eslint @eslint/js typescript-eslint eslint-plugin-react `
  eslint-plugin-react-hooks eslint-config-prettier globals `
  prettier prettier-plugin-organize-imports
```

未装 `typescript` 时需一并安装。

---

## 3. 复制 files/ → 仓库根

从 `KIT_ROOT/files/` **复制**，不要手抄：

| 源 | 目标 |
| --- | --- |
| `eslint.config.mjs` | `eslint.config.mjs` |
| `.prettierrc.cjs` | `.prettierrc.cjs` |
| `.prettierignore` | `.prettierignore` |
| `.editorconfig` | `.editorconfig` |

不要新建 `.eslintrc.*`。

---

## 4. 合并 package.json scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

同名脚本冲突时询问用户。

---

## 5. 可选：Cursor format hook（须用户同意）

默认跳过。同意时从 `KIT_ROOT/optional/cursor-format-hook/` 复制到 `.cursor/hooks/`；`hooks.json` 无则复制，有则合并 `afterFileEdit`。

---

## 6. 验证

```powershell
yarn lint
yarn format:check
```

- [ ] 配置文件与 devDependencies 就位
- [ ] 命令可执行（非模块找不到）
- [ ] 未经同意未全量 `lint:fix` / `format`

---

## 7. 安装后（日常，非本 kit）

- 改完代码：`yarn lint`（Rule **`verify-after-edit`**）
- 可选下一步：**[vitest-pure-fn-kit](../vitest-pure-fn-kit/README.md)** + Skill **`vitest-pure-fn`**

---

## 8. AI 安装 Prompt（可选）

```text
按 .cursor/templates/react-ts-lint-format-kit/README.md 安装 ESLint/Prettier/EditorConfig。
配置从 files/ 复制，不要手抄。先探测并汇报冲突；未经同意不装 format hook、不全量 lint:fix。
```

---

## 维护

1. 改规则 → 只改 `files/`，同步已落地仓库根文件（项目特例在提交说明注明）。
2. 改流程 → 只改本 README 与 INDEX.md。
3. 改 hook → `optional/cursor-format-hook/`，同步本仓 `.cursor/hooks*`。

## 与 WorkBench 本仓

根目录配置若与 `files/` 有意不一致，以根目录为准；回写模板勿抹掉可移植默认值。

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-08 | 初版 |
| 2026-08-17 | 对齐 vitest kit 模式：重命名、去掉 init Skill、流程并入 README |
