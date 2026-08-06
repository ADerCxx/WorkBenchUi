---
name: css-module-less
description: >-
  Use when 在 WorkBench 编写或修改 React/TSX 组件样式、新增 index.less、CSS Modules、
  内联 style、布局/视觉类名，或把 style={{}} 迁到 Less 时。
---

# CSS Module + Less 样式规范

## Overview

组件样式默认用 **CSS Modules + 同级 `index.less`**，与目录约定（`module-file-layout`）对齐。  
禁止把静态布局/视觉堆进 `style={{...}}`。

**Violating the letter of the rules is violating the spirit of the rules.**

---

## When to Use

- 新建/改页面、Layout、业务组件的外观与布局
- 给模块补 `index.less`，或把内联样式迁出
- 不确定该用 `className` 还是 `style`

**When NOT**

- 纯逻辑 / API / 类型，无 UI
- 只改全局主题变量文件本身（`src/styles/index.global.less`）——仍须遵守下方「CSS 变量」约定，但不必为本 skill 新建模块 less

---

## Iron Law

```
NO 大块静态样式 IN style={{}} — 写进同级 index.less + CSS Module
```

新建组件默认同时具备：

```text
ComponentName/
├── index.tsx
└── index.less    # 有布局/视觉时必有
```

```tsx
import styles from './index.less';

function Example() {
  return <header className={styles.header}>...</header>;
}
```

---

## 硬规则

1. **默认 CSS Module**：`import styles from './index.less'`，用 `className={styles.xxx}`（或 `` className={`${styles.a} ${styles.b}`} `` / 条件拼接）。
2. **文件位置**：样式与入口同级，名 `index.less`；不要散落无归属的全局 class（全局仅 `src/styles/*.global.less`）。
3. **颜色/边框/背景**：优先 `var(--text)`、`var(--text-h)`、`var(--bg)`、`var(--border)`、`var(--accent)` 等已有变量（见 `src/styles/index.global.less`）；少写死 hex，除非无对应变量且 design 明确要求。
4. **字族/字重**：按角色用 `var(--sans|--heading|--display|--mono)`，详见 `typography` skill；禁止在组件 less 写死字体族名。
5. **禁止**用内联对象写静态布局：`display`、`flex`、`gap`、`padding`、`margin`、`border`、`height`/`width`（定值）、`overflow` 等 —— 进 less。
6. **类名**：camelCase（`.header`、`.title`、`.panelFullscreen`），与现有 `Home` / `AnalysisPanel` 一致；不用 BEM 长链除非已有文件如此。

---

## 何时允许 `style` / 内联

| 允许 | 说明 |
|------|------|
| 运行时几何 | 如 `react-rnd` 的 `position` / `size`，或 JS 算出的 `width`/`left` |
| 真正动态的单点值 | 如进度条宽度 `%`、主题色来自 props 且无法预枚举 class |
| Antd 等第三方必要覆盖 | 仅动态部分；能 class 覆盖则优先 less（`:global` 慎用） |

| 禁止借口 |
|----------|
| 「就几行，先写 style」 |
| 「和 Antd 写在一起方便」|
| 「plan/design 示例里是内联」（示例过时则改代码 + 同步文档）|

`style={{ margin: 0 }}` 这类 Antd `Typography` 去默认 margin：优先 less 包一层或 `:global` 局部覆盖；若仅一行且无同级视觉块，可暂留，**同文件已有 `index.less` 时应迁入**。

---

## 写法对照

### ✅ 推荐（标杆）

- `src/pages/Home/index.tsx` + `index.less`
- `src/layouts/MainLayout/index.tsx` + `index.less`
- `src/pages/Workbench/components/AnalysisPanel/index.tsx` + `index.less`

```tsx
import styles from './index.less';

function WorkbenchHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img className={styles.logo} src={...} alt="" />
        <img className={styles.title} src={...} alt="知识织物工作台" />
      </div>
    </header>
  );
}
```

```less
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.logo,
.title {
  display: block;
  height: 28px;
  width: auto;
}
```

### ❌ 避免

```tsx
<header
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  }}
>
```

遗留重灾区（改触及时应顺手迁出，非本任务勿大范围重构）：`WorkbenchHeader`、`CatalogTree`、`RawPreview`。

---

## 与 module-file-layout

- 一模块一文件夹时，**有 UI 就配 `index.less`**（见该 skill「推荐结构」）。
- 本 skill 管**怎么写样式**；目录/类型仍以 `module-file-layout` 为准。

---

## 自检

- [ ] 静态布局/视觉是否在 `index.less`，而非大块 `style={{}}`？
- [ ] 是否 `import styles from './index.less'` + `styles.xxx`？
- [ ] 颜色/边框是否优先用全局 CSS 变量？
- [ ] 仅动态几何/动态单值才内联？
- [ ] 未把组件 class 写进 `*.global.less`？
- [ ] 字族/字重是否走 typography 角色变量？
