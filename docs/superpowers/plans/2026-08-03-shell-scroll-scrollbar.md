# Shell Scroll Lock & Unified Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 外壳宽高占满视口且不滚动，仅内容区/子容器滚动；ConfigProvider primary 与 `--accent` 对齐；全局与 Antd 常见滚动容器使用统一的灰黑半透明细圆角滚动条（与主色解耦）。

**Architecture:** 在全局样式锁定 `html/body/#root` 高度与 `overflow: hidden`；三个 Layout 的内容出口设为 `flex:1; min-height:0; overflow:auto`。滚动条用 CSS 变量（灰黑半透明；暗色白半透明）挂到全局选择器，并补齐 Antd 表体/Modal/下拉等容器。主色仅在 `main.tsx` 的 ConfigProvider 声明一次。

**Tech Stack:** Less、Antd 6 ConfigProvider、现有 `src/layouts/*`

**Spec:** `docs/superpowers/specs/2026-08-03-shell-scroll-scrollbar-design.md`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/main.tsx` | `colorPrimary: '#aa3bff'` |
| `src/styles/index.global.less` | 视口锁高、滚动条变量与全局/Antd 滚动条规则 |
| `src/layouts/MainLayout/index.less` | `.layout` 锁高、`.main` 内部滚动 |
| `src/layouts/WorkbenchLayout/index.less` | `.shell` 锁高、`.content` 内部滚动 |
| `src/layouts/BlankLayout/index.less` | `.shell` 锁高并内部滚动 |
| design / 本 plan | 实现后更新状态与勾选 |

不改路由、业务页逻辑、`src/apis/**`。

---

### Task 1: ConfigProvider 主色

**Files:**
- Modify: `src/main.tsx`

- [x] **Step 1: 设置 colorPrimary**

将 `ConfigProvider` 改为：

```tsx
<ConfigProvider
  locale={zhCN}
  theme={{
    token: {
      colorPrimary: '#aa3bff',
    },
  }}
>
  <RouterProvider router={router} />
</ConfigProvider>
```

- [ ] **Step 2: 目视确认（可选）**

打开 `/regex-settings`，确认 Switch/Button primary 为紫色系。

- [ ] **Step 3: Commit（仅当用户明确要求时再执行；默认跳过）**

---

### Task 2: 全局视口锁定 + 统一滚动条样式

**Files:**
- Modify: `src/styles/index.global.less`

- [x] **Step 1: 在 `:root` 增加滚动条 CSS 变量**

在现有 `:root` 块内（与 `--accent` 同级）增加：

```less
  --scrollbar-track: transparent;
  --scrollbar-thumb: rgba(0, 0, 0, 0.28);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.42);
```

暗色分支另写白半透明 thumb（同透明度）：

```less
  --scrollbar-thumb: rgba(255, 255, 255, 0.28);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.42);
```

- [x] **Step 2: 锁定 html / body / #root，禁止外壳滚动**

将现有 `#root` 与 `body` 相关规则替换/扩展为：

```less
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
}

#root {
  width: 100%;
  height: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}
```

删除原先单独的 `body { margin: 0; }`（已合并进上面）。

- [x] **Step 3: 全局滚动条规则**

在 `index.global.less` 末尾追加：

```less
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

*::-webkit-scrollbar-track,
*::-webkit-scrollbar-track-piece {
  background: var(--scrollbar-track);
}

*::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 999px;
  min-height: 40px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover);
}

*::-webkit-scrollbar-corner {
  background: transparent;
}
```

- [x] **Step 4: Antd 常见滚动容器补齐（同套变量，确保伪元素命中）**

在全局规则后追加（与 `*` 规则等价加固，避免部分组件 shadow/结构漏掉时仍用系统条——若 `*` 已覆盖可保留作明确清单）：

```less
.ant-table-body,
.ant-table-content,
.ant-modal-body,
.ant-drawer-body,
.ant-select-dropdown,
.ant-picker-panel-container,
.ant-menu,
.ant-cascader-menus {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

（WebKit 伪元素已由 `*` 覆盖；本块保证 Firefox `scrollbar-color` 在 Antd 节点上也生效。）

- [ ] **Step 5: Commit（默认跳过）**

---

### Task 3: 三个 Layout 内容区内部滚动

**Files:**
- Modify: `src/layouts/MainLayout/index.less`
- Modify: `src/layouts/WorkbenchLayout/index.less`
- Modify: `src/layouts/BlankLayout/index.less`

- [x] **Step 1: MainLayout**

```less
.layout {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;

  a {
    color: var(--text-h);
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}

.main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
```

- [x] **Step 2: WorkbenchLayout**

将 `.shell` 改为锁高；`.content` 改为内部滚动。保留其余类不变，仅改这些块：

```less
.shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  /* 现有样式保留，并增加： */
  flex-shrink: 0;
}

/* .header 其余规则保持原样 */

.body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
```

`.sider` 保持现有宽度与边框；若侧栏菜单过长，本轮允许侧栏自带 `overflow: auto`（可选，默认先不改侧栏，优先内容区滚动）。

- [x] **Step 3: BlankLayout**

```less
.shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
```

Blank 无顶栏：壳本身作为内部滚动容器，仍不让 `body` 滚。

- [ ] **Step 4: 目视验收**

Run: `npm run dev`，检查：
- `/`、`/regex-settings`：窗口无整页滚动；拉高内容时仅 `.main` 滚
- `/workbench`：顶栏+侧栏固定，右侧内容滚
- `/blank`：壳不撑出 body 滚动
- Table 等区域滚动条为细圆角、灰黑半透明（不过深）

- [ ] **Step 5: Commit（默认跳过）**

---

### Task 4: 同步 design / plan 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-03-shell-scroll-scrollbar-design.md`
- Modify: `docs/superpowers/plans/2026-08-03-shell-scroll-scrollbar.md`（本文件）

- [x] **Step 1: design 状态**

- `状态：待实现` → `已实现`
- 修订记录追加：`2026-08-03：已实现视口锁高、内部滚动、ConfigProvider primary 与统一滚动条`

- [x] **Step 2: 勾选本 plan 全部已完成步骤**

- [ ] **Step 3: Commit（默认跳过）**

---

## Spec 覆盖自检

| Spec 要求 | Task |
|-----------|------|
| 外壳宽高占满视口 | Task 2 + Task 3 |
| html/body/根壳不滚 | Task 2 |
| 仅内部滚动 | Task 3 |
| colorPrimary `#aa3bff` | Task 1 |
| 滚动条统一（细/圆角/灰黑半透明） | Task 2 |
| 全局 + Antd 容器 | Task 2 Step 3–4 |
| 不改路由/apis/业务逻辑 | 无对应改动 Task |

---

## 修订记录

- 2026-08-07：滚动条滑块改为常见灰黑半透明（亮色黑 / 暗色白；与主色解耦），同步 design 决策与验收口径
