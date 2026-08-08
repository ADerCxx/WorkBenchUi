---
name: react-ts-lint-format-init
description: >-
  Use when 在 React + TypeScript 仓库初始化或对齐 ESLint / Prettier / EditorConfig
  （不含 Umi / husky），或用户点名本 Skill / 工具包时。
---

# React + TypeScript：ESLint / Prettier / EditorConfig 初始化

> **给 AI / 执行者**：按本文逐步执行。配置真源在同目录 `files/`，**禁止**把全文配置再手抄一遍——从 `files/` 复制到仓库根。  
> **可选**：Cursor 编辑后自动 Prettier 见 `optional/cursor-format-hook/`（须用户同意后再装）。  
> **实现栈**：ESLint 9 Flat + Prettier 3；**禁止** `@umijs/lint`。不含 git hooks（Husky 等）。

**本 Skill 相对路径**（以本文件所在目录为 `KIT_ROOT`）：

| 路径 | 用途 |
|------|------|
| `files/` | 仓库根配置真源 |
| `optional/cursor-format-hook/` | Cursor `afterFileEdit` 格式化（可选） |
| `README.md` | 跨项目安装与维护说明 |

若本文件在 `.cursor/skills/react-ts-lint-format-init/`，而 `files/` 不在同级，则改用仓库内 `.cursor/templates/react-ts-lint-format-init/files/`。

---

## 0. 适用范围

### 适用

- 技术栈：React + TypeScript（Vite / CRA / Next.js / Rsbuild 等均可）
- 目标能力：**仅** ESLint + Prettier + EditorConfig（Cursor format hook 为可选附加）
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
- 未经用户同意，不安装 `optional/cursor-format-hook`

---

## 1. 执行前探测（必须先做，再改文件）

在目标仓库根目录收集并**向用户汇报**下列信息，有冲突时**先问再写**，禁止静默覆盖：

1. 包管理器：`pnpm` / `yarn` / `npm` / `bun`（看锁文件；多锁并存时询问用户）
2. `package.json` 是否存在；是否有 `"type": "module"`
3. 是否已有：
   - ESLint：`eslint.config.*`、`.eslintrc*`、`package.json#eslintConfig`
   - Prettier：`.prettierrc*`、`prettier.config.*`、`package.json#prettier`
   - EditorConfig：`.editorconfig`
   - Cursor hooks：`.cursor/hooks.json`、`.cursor/hooks/format-after-edit*`
4. 是否存在 `tsconfig.json`（或 `tsconfig.app.json` 等）；React 相关依赖版本（`react` / `react-dom`）
5. 源码大致目录：`src/`、`app/`、`packages/` 等（用于 ignore 与 lint glob）

**冲突策略：**

| 情况 | 做法 |
|------|------|
| 无任何相关配置 | 按本文创建全套 |
| 已有 Prettier/ESLint，用户同意对齐 | 备份旧文件为 `*.bak`（或 git 可回滚）后替换/合并，并说明差异 |
| 已有配置，用户未表态 | **停止写入**，列出差异，请用户选择：替换 / 合并 / 放弃 |
| 已装 ESLint 8 + `.eslintrc` | 说明将升级到 ESLint 9 Flat；删除/停用旧 eslintrc，避免双轨 |

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
prettier-plugin-organize-imports
```

若 TypeScript 项目未安装 `typescript`，需一并安装（organize-imports / TS 解析需要）。

### 安装命令示例

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

从 `KIT_ROOT/files/` **复制**到仓库根（路径均相对仓库根）。不要手写覆盖 `files/` 内容，除非探测后需按仓库增补 ignore。

| 源（`files/`） | 目标（仓库根） |
|----------------|----------------|
| `eslint.config.mjs` | `eslint.config.mjs` |
| `.prettierrc.cjs` | `.prettierrc.cjs` |
| `.prettierignore` | `.prettierignore` |
| `.editorconfig` | `.editorconfig` |

**说明：**

- 优先 `.mjs`，避免受 `package.json#type` 影响。
- monorepo 可收窄 `files` 或补 `ignores`；发现构建产物目录遗漏时再补 `.prettierignore` / ESLint `ignores`。
- **不要**再创建 `.eslintrc.*`，以免与 flat config 双轨。
- 可选：团队若需要整理 `package.json` 字段顺序，可再加 `prettier-plugin-packagejson`（**非必须**）。

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

若已有同名脚本：语义等价则保留；冲突则询问用户，或改用 `lint:es` / `format:write` 等不冲突命名并说明。

---

## 5. 可选：Cursor format-after-edit hook

**默认跳过。** 仅当用户明确要求「装 Cursor 编辑后格式化 / format hook」时执行。

前置：第 2–4 步已完成，且 `node_modules/prettier` 可用。

1. 确保目录：`.cursor/hooks/`
2. 从 `KIT_ROOT/optional/cursor-format-hook/` 复制：
   - `format-after-edit.cmd` → `.cursor/hooks/format-after-edit.cmd`
   - `format-after-edit.mjs` → `.cursor/hooks/format-after-edit.mjs`
3. `hooks.json`：
   - 若仓库**无** `.cursor/hooks.json`：复制为 `.cursor/hooks.json`
   - 若**已有**：合并 `hooks.afterFileEdit`，保留其它 hook；已有等价 `format-after-edit` 则跳过并说明
4. 告知用户：依赖本机 PATH 上的 `node`；日志在 `.cursor/hooks/format-after-edit.log`；失败不阻断编辑（exit 0）

**注意**：此为 Cursor IDE hook，**不是** Husky / lint-staged。

---

## 6. 验证（完成前必跑）

```bash
# 使用对应包管理器
pnpm lint          # 或 npm run lint / yarn lint
pnpm format:check  # 或 npm run format:check / yarn format:check
```

**成功标准：**

- [ ] `eslint.config.mjs`、`.prettierrc.cjs`、`.prettierignore`、`.editorconfig` 已存在
- [ ] 相关 devDependencies 已写入 lockfile
- [ ] `lint` / `format:check` 可执行（非「模块找不到 / 配置语法错误」）
- [ ] 未安装 husky / lint-staged / commitlint / stylelint / `@umijs/lint`（除非仓库原先已有且用户要求保留）
- [ ] 未静默覆盖用户拒绝替换的旧配置
- [ ] 若装了 optional hook：`.cursor/hooks.json` 与 `format-after-edit.*` 已就位
- [ ] 向用户汇报变更文件与存量 lint 数量级；**未授权**时不做全量 `lint:fix` / `format`

**存量问题：** 默认只初始化；仅当用户明确要求时再 `format` / `lint:fix`（优先格式化，谨慎 auto-fix）。

---

## 7. 本工具包交付结果

| 项 | 结果 |
|----|------|
| ESLint | 9 Flat + typescript-eslint + react / react-hooks；`eslint-config-prettier` 收尾 |
| Prettier | 3 + `prettier-plugin-organize-imports`；单引号、80 宽、尾逗号 `all` |
| EditorConfig | 2 空格缩进、LF、utf-8、去行尾空白 |
| 不包含 | Stylelint、Husky、lint-staged、commitlint、`@umijs/lint` |
| 可选 | Cursor `afterFileEdit` 单文件 Prettier（≠ git hooks） |

---

## 8. 一键 Prompt（复制到目标项目对话）

```text
请严格按 Skill「react-ts-lint-format-init」执行工具链初始化。
配置从该 Skill 目录（或 .cursor/templates/react-ts-lint-format-init/）下的 files/ 复制，不要手抄。

约束：
1. 先做探测并汇报；有配置冲突先问我，禁止静默覆盖。
2. 只做 ESLint 9 Flat + Prettier 3 + EditorConfig；不要装 husky / lint-staged / commitlint / stylelint / @umijs/lint。
3. 未经我明确同意，不要安装 optional/cursor-format-hook。
4. 验证 lint 与 format:check 可启动；未经同意不要全量 format / lint:fix。
5. 完成后给出变更文件列表与检查清单勾选结果。
```

---

## 9. 维护说明

- 改规则时只改 `files/` 与本 Skill 流程描述，避免再把整文件嵌进 Markdown。
- 依赖名变更时同步改第 2 节与 README。
- Stylelint / git hooks 另开工具包，勿膨胀本文。
