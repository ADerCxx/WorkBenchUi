# Full-Width Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `#root` 改为全宽外壳，解除 1126px 居中限宽，页面内容宽度由各路由自行控制。

**Architecture:** 根因在全局样式 `src/styles/index.global.less` 的 `#root`。只改该选择器；三个 Layout 与业务页本轮不动。Design 见 `docs/superpowers/specs/2026-08-03-full-width-shell-design.md`。

**Tech Stack:** Less 全局样式、Vite + React 现有壳

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/styles/index.global.less` | 修改 `#root` 为全宽壳 |
| `docs/superpowers/specs/2026-08-03-full-width-shell-design.md` | 已有 design；实现后把状态改为「已实现」并补修订记录 |
| `docs/superpowers/plans/2026-08-03-full-width-shell.md` | 本 plan；完成后勾选 Task |

不新建 Layout / 页面文件。

---

### Task 1: 修改 `#root` 全宽

**Files:**
- Modify: `src/styles/index.global.less`（`#root` 块）

- [x] **Step 1: 将 `#root` 替换为全宽壳**

把现有：

```less
#root {
  width: 1126px;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  border-inline: 1px solid var(--border);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

改为：

```less
#root {
  width: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

- [x] **Step 2: 本地目视验收**

Run: 若开发服已在跑则刷新；否则在 `D:\myComponent\WorkBench` 执行 `pnpm dev`（或以项目惯用的 `npm run dev`）后打开首页、`/regex-settings`、`/workbench`。

Expected:
- 宽屏下无居中固定宽列、无双侧竖线边框
- 顶栏 / 工作台侧栏横向铺满
- 路由与业务行为无回归（仅宽度变化）

- [x] **Step 3: 同步 design 状态**

Modify `docs/superpowers/specs/2026-08-03-full-width-shell-design.md`：
- 状态：`待实现` → `已实现`
- 修订记录追加：`2026-08-03：已按方案 1 修改 #root 为全宽壳`

- [x] **Step 4: 勾选本 plan Task 1 全部步骤**

- [ ] **Step 5: Commit（仅当用户明确要求时再执行；默认跳过）**

```powershell
git add src/styles/index.global.less docs/superpowers/specs/2026-08-03-full-width-shell-design.md docs/superpowers/plans/2026-08-03-full-width-shell.md
git commit -m "$(@'
fix: make app shell full-width via #root

'@)"
```

---

## Spec 覆盖自检

| Spec 要求 | Task |
|-----------|------|
| `#root` 横向占满 | Task 1 Step 1 |
| 去掉居中与双侧边框 | Task 1 Step 1 |
| Layout / 路由 / 业务页不改 | 无对应改动 Task（刻意） |
| 保留 min-height 撑满视口 | Task 1 Step 1 保留 `min-height: 100svh` |
| 验收宽屏贴边 | Task 1 Step 2 |
