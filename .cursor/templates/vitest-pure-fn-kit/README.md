# vitest-pure-fn-kit 安装参考

在 **Vite + React + TypeScript** 仓库按需启用 **Vitest 纯函数测试层** 的初始化文件。  
**不是**必装模块；**不是**一键安装全部脚手架 kit。

## 适用场景

- 已决定做 Node 环境纯函数单测（`__tests__/`）
- 需要空白的 **项目单测索引表**（`reference.md`）
- 需要 `vitest.config.ts`、`docs/test/strategy.md` 等首次落盘

## 前置

- Node.js 20+
- 建议已有 `yarn lint`（如已装 **react-ts-lint-format-kit**）
- Skill **`vitest-pure-fn`** 已在 `.cursor/skills/`（脚手架自带，无需从 kit 复制 SKILL.md）

## 安装步骤

### 1. 复制 kit 到 templates（跨项目时）

```powershell
Copy-Item -Recurse -Force `
  <脚手架源>\.cursor\templates\vitest-pure-fn-kit `
  .cursor\templates\
```

### 2. 复制 files/

```powershell
$KIT = .cursor\templates\vitest-pure-fn-kit
Copy-Item -Force $KIT\files\vitest.config.ts vitest.config.ts
New-Item -ItemType Directory -Force -Path docs\test\fixtures | Out-Null
Copy-Item -Force $KIT\files\docs\test\strategy.md docs\test\strategy.md
Copy-Item -Force $KIT\files\docs\test\fixtures\README.md docs\test\fixtures\README.md
```

### 3. 复制 cursor/

```powershell
Copy-Item -Force $KIT\cursor\rules\vitest-conventions.mdc .cursor\rules\
```

**verify-after-edit**：若不存在 → 复制 `verify-after-edit.with-vitest.mdc` 为 `verify-after-edit.mdc`；若已存在 → 仅合并「纯函数改动时 `yarn test`」一步。

**reference.md（空索引表）**：

```powershell
New-Item -ItemType Directory -Force -Path .cursor\skills\vitest-pure-fn | Out-Null
Copy-Item -Force `
  $KIT\cursor\skills\vitest-pure-fn\reference.md `
  .cursor\skills\vitest-pure-fn\reference.md
```

若已有业务索引表，**勿覆盖**——只合并 kit 中缺失的章节标题。

### 4. 依赖与 scripts

```powershell
yarn add -D vitest@^4
```

`package.json` 增加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

### 5. 验证

```powershell
yarn test
yarn lint
```

### 6. 可选

- CI：见 `optional/ci/`（须确认后再复制）
- 示例：`samples/src/lib/`（须确认后再复制）

## 安装后

- 日常 invoke Skill **`vitest-pure-fn`**
- 在 `reference.md` **项目单测索引** 表中登记用例
- 改 kit 默认 → 先改 `templates/vitest-pure-fn-kit/`，再同步本仓

## 与 react-ts-lint-format-kit

无强制顺序；建议 lint 可用后再加 test 门禁。

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-17 | 初版；kit 仅含初始化文件，不含 Skill 正文 |
