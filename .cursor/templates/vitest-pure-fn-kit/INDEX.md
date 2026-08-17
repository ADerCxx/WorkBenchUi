# vitest-pure-fn-kit 安装包索引

> 本 kit 仅含 **需初始化落盘** 的内容；日常 workflow 见 Skill **`vitest-pure-fn`**（位于 `.cursor/skills/`，不从此 kit 安装）。  
> 安装步骤见 [README.md](./README.md)。

## 为何需要 kit

Skill `vitest-pure-fn` 的 [reference.md](../skills/vitest-pure-fn/reference.md) 含 **项目单测索引表**——空项目须从本 kit 复制**空表**再填写。  
另含 Vitest 配置、测试 Rule、`docs/test` 策略等首次落地文件。

## 包结构

```text
vitest-pure-fn-kit/
├── INDEX.md              ← 本文件
├── README.md             ← 安装参考（非 Skill，按需手工/AI 执行）
├── files/                → 仓库根
├── cursor/               → .cursor/
├── optional/ci/
└── samples/              → 可选示例，不自动复制
```

## files/ → 仓库根

| 模板 | 落地 | 说明 |
| --- | --- | --- |
| `files/vitest.config.ts` | `vitest.config.ts` | Node；`src/**/__tests__/**/*.test.ts` |
| `files/docs/test/strategy.md` | `docs/test/strategy.md` | 测试策略 |
| `files/docs/test/fixtures/README.md` | `docs/test/fixtures/README.md` | 夹具目录说明 |

## cursor/ → .cursor/

| 模板 | 落地 | 说明 |
| --- | --- | --- |
| `cursor/rules/vitest-conventions.mdc` | `.cursor/rules/vitest-conventions.mdc` | 硬约束 |
| `cursor/rules/verify-after-edit.with-vitest.mdc` | 见 README §verify-after-edit | 含 test 步骤 |
| `cursor/skills/vitest-pure-fn/reference.md` | `.cursor/skills/vitest-pure-fn/reference.md` | **空索引表**（安装时覆盖或新建） |

**不从此 kit 安装**：`vitest-pure-fn/SKILL.md`（已在脚手架 `.cursor/skills/`）。

## optional/

| 模板 | 落地 |
| --- | --- |
| `optional/ci/github/workflows/ci.yml` | `.github/workflows/ci.yml` |

## package.json（README 内合并）

- `devDependencies.vitest`
- `scripts.test` / `scripts.test:watch`

## 引用关系

```text
vitest-pure-fn (Skill)     日常：写测、判定纯函数、验证
        │
        ├── reference.md ← 本 kit 提供空索引表；项目维护填写
        ├── vitest-conventions (Rule)
        └── verify-after-edit (Rule)
```

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-17 | 初版 |
