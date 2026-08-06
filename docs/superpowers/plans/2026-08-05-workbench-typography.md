# 工作台字体体系（Typography）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Google Fonts CDN + CSS 角色变量统一 WorkBench 字样，落地 typography skill/rule，并改现有关键页面。

**Architecture:** `index.html` 拉字体；`:root` 定义 `--sans` / `--heading` / `--display` / `--mono`；Antd `token.fontFamily` 字面量复制 `--sans` 栈；组件 less 按角色引用变量；独立 `typography` skill + rule，`css-module-less` 交叉引用。

**Tech Stack:** Google Fonts CDN、Less CSS Modules、antd ConfigProvider、Cursor skill/rule

**Spec:** `docs/superpowers/specs/2026-08-05-workbench-typography-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。本计划以手工视觉核对为主（无纯函数可测）。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `index.html` | Google Fonts preconnect + stylesheet |
| `src/styles/index.global.less` | 字体变量、全局 h1/h2/code 字族字重 |
| `src/main.tsx` | Antd `fontFamily` token |
| `src/pages/Home/index.less` | Hero display；UI 字重 |
| `src/pages/Workbench/components/WorkbenchHeader/index.less` | 品牌标题 display |
| `src/pages/RegexSettings/index.less` | 页标题 heading |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 面板标题 heading |
| `src/pages/Workbench/components/RawPreview/index.less` | path mono |
| `src/layouts/WorkbenchLayout/index.less` | 遗留 layout 标题 heading（路由未用，顺带对齐） |
| `.cursor/skills/typography/SKILL.md` | 字样约定 skill |
| `.cursor/rules/typography.mdc` | 触发读 skill 的短 rule |
| `.cursor/skills/css-module-less/SKILL.md` | 交叉引用 typography |
| `docs/superpowers/specs/2026-08-05-workbench-typography-design.md` | 收尾改状态为已实现 |

**共享字面量（全文一致，勿各写各的）：**

```text
SANS   = Inter, "Noto Sans SC", system-ui, "Segoe UI", Roboto, sans-serif
DISPLAY = "Space Grotesk", Inter, "Noto Sans SC", system-ui, "Segoe UI", Roboto, sans-serif
MONO   = "IBM Plex Mono", ui-monospace, Consolas, monospace
```

`--heading` 与 `--sans` 使用同一栈 `SANS`。

---

### Task 1: CDN 加载字体

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 在 `<head>` 加入 preconnect 与 stylesheet**

将 `index.html` 的 `<head>` 改为（保留既有 meta / icon / title）：

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/fabricIcon.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=Inter:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&family=Space+Grotesk:wght@600&display=swap"
    rel="stylesheet"
  />
  <title>fabric</title>
</head>
```

- [ ] **Step 2: 核对 HTML 结构**

打开 `index.html`，确认：`preconnect` 两条在 stylesheet 之前；`crossorigin` 在 gstatic 那条上；`display=swap` 在 URL 末尾；无重复 link。

---

### Task 2: 全局 CSS 变量与元素默认

**Files:**
- Modify: `src/styles/index.global.less`

- [ ] **Step 1: 替换字体变量并新增 `--display`**

将 `:root` 内现有：

```less
  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;
```

替换为：

```less
  --sans: Inter, 'Noto Sans SC', system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: Inter, 'Noto Sans SC', system-ui, 'Segoe UI', Roboto, sans-serif;
  --display: 'Space Grotesk', Inter, 'Noto Sans SC', system-ui, 'Segoe UI',
    Roboto, sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
```

保留 `:root` 的 `font: 18px/145% var(--sans);` 不动。

- [ ] **Step 2: 更新 `h1, h2` 字重**

将：

```less
h1,
h2 {
  font-family: var(--heading);
  font-weight: 500;
  color: var(--text-h);
}
```

改为：

```less
h1,
h2 {
  font-family: var(--heading);
  font-weight: 700;
  color: var(--text-h);
}
```

确认 `code { font-family: var(--mono); ... }` 仍在，无需改其他属性。

- [ ] **Step 3: 快速 grep 确认变量**

```powershell
cd D:\myComponent\WorkBench
Select-String -Path src\styles\index.global.less -Pattern "--sans:|--heading:|--display:|--mono:|font-weight: 700"
```

Expected: 四条变量命中；`h1,h2` 为 `font-weight: 700`；无残留 `system-ui` 作为 `--sans` 首项。

---

### Task 3: Antd fontFamily token

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: 写入与 `--sans` 相同的字面量栈**

将 `ConfigProvider` 的 `theme.token` 改为：

```tsx
      theme={{
        token: {
          colorPrimary: '#1677ff',
          fontFamily:
            'Inter, "Noto Sans SC", system-ui, "Segoe UI", Roboto, sans-serif',
        },
      }}
```

注意：双引号包住含空格的族名，与 CSS 中单引号写法等价；**不要**写 `var(--sans)`。

- [ ] **Step 2: 与全局 less 对照**

目视对比 `index.global.less` 的 `--sans` 与 `main.tsx` 的 `fontFamily`：家族顺序与名称一致（仅引号风格可不同）。

---

### Task 4: 现有页面按角色改字样

**Files:**
- Modify: `src/pages/Home/index.less`
- Modify: `src/pages/Workbench/components/WorkbenchHeader/index.less`
- Modify: `src/pages/RegexSettings/index.less`
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.less`
- Modify: `src/pages/Workbench/components/RawPreview/index.less`
- Modify: `src/layouts/WorkbenchLayout/index.less`

- [ ] **Step 1: Home Hero / UI**

在 `.title` 中增加/调整为：

```less
.title {
  margin: 0 0 14px;
  font-family: var(--display);
  font-size: 48px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--text-h);
}
```

在 `.cta` 中增加 `font-weight: 600;`（保留既有其余属性）。`.subtitle` / `.meta` 不写 `font-family`（继承 `--sans`）；确认 `.subtitle` 为 `font-weight: 400`。

- [ ] **Step 2: WorkbenchHeader 品牌标题**

品牌标题改为图片（非 display 字样）：`fabricNameIcon.png`，`.title` 为图片尺寸样式：

```less
.title {
  display: block;
  height: 28px;
  width: auto;
  flex-shrink: 0;
}
```

- [ ] **Step 3: RegexSettings 页标题**

将 `.heading` 改为：

```less
.heading {
  margin: 0;
  font-family: var(--heading);
  font-weight: 700;
}
```

- [ ] **Step 4: AnalysisPanel 标题**

将 `.title` 改为：

```less
.title {
  font-family: var(--heading);
  font-weight: 700;
  font-size: 14px;
}
```

- [ ] **Step 5: RawPreview 路径**

在 `.path` 中增加 `font-family: var(--mono);`（保留既有 display/padding/border/word-break）。确认 `.content` 已有 `font-family: var(--mono);`。

- [ ] **Step 6: WorkbenchLayout（遗留）**

将 `.title` 改为：

```less
.title {
  margin: 0;
  font-size: 16px;
  font-family: var(--heading);
  font-weight: 700;
  color: var(--text-h);
}
```

- [ ] **Step 7: 禁止硬编码族名**

```powershell
cd D:\myComponent\WorkBench
Select-String -Path src\pages\**\*.less,src\layouts\**\*.less -Pattern "Inter|Space Grotesk|IBM Plex|Noto Sans" -SimpleMatch
```

Expected: **无命中**（族名只应出现在 `index.global.less` 与 `main.tsx`）。若 PowerShell glob 不展开，改用：

```powershell
Get-ChildItem -Path src\pages,src\layouts -Recurse -Filter *.less | Select-String -Pattern "Inter|Space Grotesk|IBM Plex|Noto Sans"
```

Expected: 无命中。

---

### Task 5: typography skill + rule，并挂钩 css-module-less

**Files:**
- Create: `.cursor/skills/typography/SKILL.md`
- Create: `.cursor/rules/typography.mdc`
- Modify: `.cursor/skills/css-module-less/SKILL.md`

- [ ] **Step 1: 创建 typography skill**

创建 `.cursor/skills/typography/SKILL.md`，全文如下：

```markdown
---
name: typography
description: >-
  Use when 在 WorkBench 编写或修改 UI/样式的字族与字重、标题/代码字样，
  或提到 Inter、Space Grotesk、IBM Plex Mono、Noto Sans、font-family、字体体系时。
---

# Typography 字样规范

## Overview

四角色：`--sans`（UI/正文）、`--heading`（普通标题）、`--display`（品牌/Hero）、`--mono`（代码）。  
布局与 CSS Module 写法见 `css-module-less`；本 skill 只管字族/字重。

**Violating the letter of the rules is violating the spirit of the rules.**

## 角色表

| 角色 | 变量 | 字重 | 何时用 |
|------|------|------|--------|
| UI / 正文 | `--sans` | 400 / 600 | 默认；按钮、导航、表单、说明 |
| 普通标题 | `--heading` | 700 | 页面/区块/面板标题 |
| 品牌 / Hero | `--display` | 600 | 仅品牌名或首页主标题等强调位 |
| 代码 | `--mono` | 400 | `code` / `pre`、路径、正则展示 |

栈定义在 `src/styles/index.global.less`；Antd `fontFamily` 在 `src/main.tsx`（与 `--sans` 字面量同步）。  
字体当前由 `index.html` Google Fonts CDN 加载（含 Noto Sans SC）。

## 硬规则

1. **禁止**在组件 less/tsx 写死 `Inter` / `Space Grotesk` / `IBM Plex Mono` / `Noto Sans SC`；一律 `var(--sans|--heading|--display|--mono)`。
2. 默认不写 `font-family` → 继承 `--sans`。
3. 不确定是不是「品牌/Hero」时用 `--heading`，不要用 `--display`。
4. 换加载方式（`@fontsource` / 自托管）时只改 `index.html`（或新增 import）与变量/token 定义处；**不改**角色语义。

## 与 css-module-less

- 静态布局/视觉进同级 `index.less` + CSS Module → `css-module-less`
- 字族/字重选哪个变量 → 本 skill
```

- [ ] **Step 2: 创建 typography rule**

创建 `.cursor/rules/typography.mdc`：

```markdown
---
description: WorkBench 字族/字重按角色变量；编辑样式时遵循 typography skill。
globs: src/**/*.{tsx,jsx,less}
alwaysApply: false
---

# Typography

编辑 `src` 下组件或 Less 涉及字样时：

1. **先读并遵守**项目 Skill：`.cursor/skills/typography/SKILL.md`
2. 角色 → `var(--sans|--heading|--display|--mono)`；禁止硬编码字体族名
3. 普通标题 `--heading` 700；仅品牌/Hero 用 `--display` 600；代码 `--mono`

布局写法仍以 `css-module-less` 为准。
```

- [ ] **Step 3: 在 css-module-less 交叉引用**

在 `.cursor/skills/css-module-less/SKILL.md` 的硬规则第 3 条（颜色/边框/背景优先 CSS 变量）**之后**插入新的第 4 条，并将原 4、5 顺延为 5、6：

原：

```markdown
3. **颜色/边框/背景**：优先 `var(--text)`、`var(--text-h)`、`var(--bg)`、`var(--border)`、`var(--accent)` 等已有变量（见 `src/styles/index.global.less`）；少写死 hex，除非无对应变量且 design 明确要求。
4. **禁止**用内联对象写静态布局：`display`、`flex`、`gap`、`padding`、`margin`、`border`、`height`/`width`（定值）、`overflow` 等 —— 进 less。
5. **类名**：camelCase（`.header`、`.title`、`.panelFullscreen`），与现有 `Home` / `AnalysisPanel` 一致；不用 BEM 长链除非已有文件如此。
```

改为：

```markdown
3. **颜色/边框/背景**：优先 `var(--text)`、`var(--text-h)`、`var(--bg)`、`var(--border)`、`var(--accent)` 等已有变量（见 `src/styles/index.global.less`）；少写死 hex，除非无对应变量且 design 明确要求。
4. **字族/字重**：按角色用 `var(--sans|--heading|--display|--mono)`，详见 `typography` skill；禁止在组件 less 写死字体族名。
5. **禁止**用内联对象写静态布局：`display`、`flex`、`gap`、`padding`、`margin`、`border`、`height`/`width`（定值）、`overflow` 等 —— 进 less。
6. **类名**：camelCase（`.header`、`.title`、`.panelFullscreen`），与现有 `Home` / `AnalysisPanel` 一致；不用 BEM 长链除非已有文件如此。
```

可选：在「自检」列表末尾加一条 `- [ ] 字族/字重是否走 typography 角色变量？`

---

### Task 6: 手工验证 + 更新 spec 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-05-workbench-typography-design.md`

- [x] **Step 1: 启动开发服并目视核对**

```powershell
cd D:\myComponent\WorkBench
yarn dev
```

按 spec「测试计划」勾选：

- [ ] Network：fonts.googleapis / gstatic 成功；正文 Inter，中文 Noto Sans SC
- [ ] `/`：主标题 Space Grotesk；副标题 Inter
- [ ] `/workbench`：顶栏图标 + 标题图 `fabricNameIcon.png`；选文件后 RawPreview 路径与正文 IBM Plex Mono
- [ ] `/regex-settings`：页标题 Inter 700
- [ ] 工作台打开分析工具：面板标题 Inter 700
- [ ] Antd 按钮等为 Inter 栈
- [ ]（可选）屏蔽 fonts 域名：页面仍可读

- [x] **Step 2: 将 spec 状态改为已实现**

将文件头：

```markdown
状态：设计已定，待实现
```

改为：

```markdown
状态：已实现
```

- [x] **Step 3: 跳过 commit**

除非用户明确要求，否则不执行 `git commit`。

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| CDN 加载四字体 | Task 1 |
| `--sans/--heading/--display/--mono` + 全局 h1/h2/code | Task 2 |
| Antd fontFamily | Task 3 |
| Home / Header / Regex / Analysis / RawPreview / WorkbenchLayout | Task 4 |
| typography skill + rule；css-module-less 引用 | Task 5 |
| 测试计划 + spec 状态 | Task 6 |
| 非目标（不换本地字体、无工具类等） | 全计划未引入 |

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-06 | 工作台顶栏品牌标题改为图片 `fabricNameIcon.png`，不再要求 Space Grotesk 文字 |
