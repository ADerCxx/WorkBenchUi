# React + TypeScript：ESLint / Prettier / EditorConfig 初始化手册

> **给 AI / 执行者**：本文是可逐步执行的操作说明。目标是在任意 **React + TypeScript** 仓库中，初始化与 ForgeKit **规范意图对齐** 的编辑期工具链（不含 Umi、不含 git hooks）。  
> **来源仓库参考**：ForgeKit 的 `.prettierrc.js`、`.editorconfig`（规则意图）；实现栈改为 ESLint 9 Flat + Prettier 3，**禁止**使用 `@umijs/lint`。

---

## 0. 适用范围

### 适用

- 技术栈：React + TypeScript（Vite / CRA / Next.js / Rsbuild 等均可）
- 目标能力：**仅** ESLint + Prettier + EditorConfig
- 使用方式：人工或 AI 按本文逐步执行

### 不适用（遇到则停止并说明原因）

- Vue / Svelte / 纯 Node 后端为主、无 React 前端
- 用户明确禁止改动既有 lint/format 体系
- 仓库已用 Biome / oxlint 等且用户要求保留为唯一规范工具

### 非目标（禁止擅自扩展）

- 不安装、不配置：Stylelint、Husky、lint-staged、commitlint
- 不依赖、不引入：`@umijs/lint`、father、dumi 专用预设
- 不强制在本任务内修完全仓库存量 lint/format 问题
- 不修改业务代码逻辑（除非仅为消除「配置本身导致命令无法启动」的阻塞错误）

---

## 1. 执行前探测（必须先做，再改文件）

在目标仓库根目录收集并**向用户汇报**下列信息，有冲突时**先问再写**，禁止静默覆盖：

1. 包管理器：`pnpm` / `yarn` / `npm` / `bun`（看锁文件；多锁并存时询问用户）
2. `package.json` 是否存在；是否有 `"type": "module"`
3. 是否已有：
   - ESLint：`eslint.config.*`、`.eslintrc*`、`package.json#eslintConfig`
   - Prettier：`.prettierrc*`、`prettier.config.*`、`package.json#prettier`
   - EditorConfig：`.editorconfig`
4. 是否存在 `tsconfig.json`（或 `tsconfig.app.json` 等）；React 相关依赖版本（`react` / `react-dom`）
5. 源码大致目录：`src/`、`app/`、`packages/` 等（用于 ignore 与 lint glob）

**冲突策略：**

| 情况                               | 做法                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| 无任何相关配置                     | 按本文创建全套                                               |
| 已有 Prettier/ESLint，用户同意对齐 | 备份旧文件为 `*.bak`（或 git 可回滚）后替换/合并，并说明差异 |
| 已有配置，用户未表态               | **停止写入**，列出差异，请用户选择：替换 / 合并 / 放弃       |
| 已装 ESLint 8 + `.eslintrc`        | 说明将升级到 ESLint 9 Flat；删除/停用旧 eslintrc，避免双轨   |

---

## 2. 依赖安装

使用探测到的包管理器，将下列包装为 **devDependencies**。版本原则：

- 使用各包当前主流大版本，且 **同一工具链内 API 一致**（ESLint 9 ↔ flat config；不要 ESLint 8 + `eslint.config.js` 混用）
- **禁止**安装与本文无关的 `@umijs/*` lint 包
- 若目标仓库已有同名依赖：保留可兼容的已有版本；若 major 过旧无法支持 flat，再升级并告知用户

### 必装

```text
eslint
@eslint/js
typescript-eslint
eslint-plugin-react
eslint-plugin-react-hooks
eslint-config-prettier
globals
prettier
```

### 默认开启（与 ForgeKit 一致）

```text
prettier-plugin-organize-imports
```

若 TypeScript 项目未安装 `typescript`，需一并安装（organize-imports / TS 解析需要）。

### 安装命令示例（按包管理器三选一）

```bash
# pnpm
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier globals prettier prettier-plugin-organize-imports

# yarn
yarn add -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier globals prettier prettier-plugin-organize-imports

# npm
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier globals prettier prettier-plugin-organize-imports
```

---

## 3. 写入配置文件

以下模板为默认方案。路径均相对**仓库根目录**。

### 3.1 `eslint.config.mjs`

优先使用 `.mjs`，避免受 `package.json#type` 影响。

```js
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.next/**",
      "**/out/**",
      "**/.umi/**",
      "**/.dumi/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      // 与 ForgeKit「简洁、少噪声」取向一致的轻量收紧（可按项目再调）
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // 必须放在最后：关闭与 Prettier 冲突的 ESLint 格式类规则
  eslintConfigPrettier,
);
```

**说明：**

- 若仓库是 monorepo，可按包收窄 `files`，或在根配置中增加更精确的 `ignores`。
- Next.js 等若官方推荐额外 ignore（如 `.next`），已包含；发现构建产物目录遗漏时再补。
- **不要**再创建 `.eslintrc.*`，以免与 flat config 双轨。

### 3.2 `.prettierrc.cjs`

对齐 ForgeKit `.prettierrc.js` 的意图（Prettier 3 + organize-imports）：

```js
module.exports = {
  plugins: ["prettier-plugin-organize-imports"],
  printWidth: 80,
  proseWrap: "never",
  singleQuote: true,
  trailingComma: "all",
  overrides: [
    {
      files: "*.md",
      options: {
        proseWrap: "preserve",
      },
    },
  ],
};
```

可选：若团队需要整理 `package.json` 字段顺序，可再加入 `prettier-plugin-packagejson`（ForgeKit 有；**非必须**，默认不装以降低异栈成本）。

### 3.3 `.prettierignore`

```text
node_modules
dist
build
coverage
.next
out
pnpm-lock.yaml
yarn.lock
package-lock.json
*.min.js
```

按仓库实际情况增补（如 `docs-dist`、`storybook-static`）。

### 3.4 `.editorconfig`

与 ForgeKit 保持一致：

```ini
# http://editorconfig.org
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

## 4. 更新 `package.json` scripts

仅**新增或合并**下列脚本，不要改写无关业务脚本的语义：

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

若已有同名脚本：

- 语义等价 → 保留
- 语义冲突 → 询问用户；或使用 `lint:es` / `format:write` 等不冲突命名，并在汇报中说明

---

## 5. 验证（完成前必跑）

按顺序执行（使用对应包管理器的 `run`）：

```bash
# 1) ESLint 能启动（允许仓库内已有 warning/error，但进程应能跑完或仅因规则告警退出）
pnpm lint
# 或: npm run lint / yarn lint

# 2) Prettier check 能启动
pnpm format:check
```

**成功标准：**

- [ ] `eslint.config.mjs`、`.prettierrc.cjs`、`.prettierignore`、`.editorconfig` 已存在
- [ ] 相关 devDependencies 已写入 lockfile
- [ ] `lint` / `format:check` 命令可执行（非「模块找不到 / 配置语法错误」）
- [ ] 未安装 husky / lint-staged / commitlint / stylelint / `@umijs/lint`（除非仓库原先已有且用户要求保留）
- [ ] 未静默覆盖用户拒绝替换的旧配置
- [ ] 向用户简要汇报：改了哪些文件、是否有存量 lint 问题（数量级即可），**不**在未授权时全量 `lint:fix` / `format` 改业务代码

**存量问题处理建议：**

- 默认：只初始化工具链，列出告警概况
- 仅当用户明确说「一并格式化/修复」时，再运行 `format` 或 `lint:fix`，并控制在合理范围内（优先格式化，谨慎 auto-fix）

---

## 6. 与 ForgeKit 原工具链的差异（告知用户即可）

| 项                 | ForgeKit 本仓库                          | 本文初始化结果                            |
| ------------------ | ---------------------------------------- | ----------------------------------------- |
| ESLint 预设        | `@umijs/lint` + ESLint 8                 | ESLint 9 Flat + typescript-eslint + react |
| Prettier           | v2 + organize-imports + packagejson 插件 | v3 + organize-imports（packagejson 可选） |
| Stylelint          | 有                                       | **无**                                    |
| Husky / commitlint | 有                                       | **无**                                    |
| 格式风格           | 单引号、80 宽、尾逗号 all                | **对齐**                                  |

---

## 7. 一键 Prompt（复制到目标项目对话）

将下方整段发给目标仓库中的 AI，并把手册路径换成实际可访问路径（若已把本文件拷贝进目标仓，则指向仓内路径）：

```text
请严格按《React + TypeScript：ESLint / Prettier / EditorConfig 初始化手册》执行工具链初始化。

约束：
1. 先做第 1 节探测并汇报；有配置冲突先问我，禁止静默覆盖。
2. 只做 ESLint 9 Flat + Prettier 3 + EditorConfig；不要装 husky / lint-staged / commitlint / stylelint / @umijs/lint。
3. 配置与 scripts 按手册模板写入；验证 lint 与 format:check 可启动。
4. 未经我明确同意，不要全量 format / lint:fix 改业务代码。
5. 完成后给出变更文件列表与检查清单勾选结果。
```

---

## 8. 维护说明（给手册维护者）

- 更新模板时保持「可复制粘贴」；避免只写原则不写文件内容。
- 依赖名变更（例如 `typescript-eslint` 包名演进）时同步改第 2、3 节。
- 若未来要加 Stylelint 或 git hooks，另开文档，不要把本手册膨胀成全套门禁。
