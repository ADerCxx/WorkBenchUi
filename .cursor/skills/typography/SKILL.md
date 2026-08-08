---
name: typography
description: >-
  Use when 编写或修改 UI/样式的字族与字重、标题/代码字样，
  或提到 Inter、Space Grotesk、IBM Plex Mono、Noto Sans、font-family、字体体系时。
---

# Typography 字样规范

## Overview

四角色：`--sans`（UI/正文）、`--heading`（普通标题）、`--display`（品牌/Hero）、`--mono`（代码）。  
布局与 CSS Module 写法见 `css-module-less`；本 skill 只管字族/字重。

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

- 写/改组件 less 或 TSX 中的字族、字重
- 不确定该用 `--sans` / `--heading` / `--display` / `--mono`
- 讨论或调整字体栈、加载方式

**When NOT**

- 纯布局/颜色/间距且不涉及字族 → `css-module-less`
- 无 UI 的逻辑改动

## 角色表

| 角色 | 变量 | 字重 | 何时用 |
|------|------|------|--------|
| UI / 正文 | `--sans` | 400 / 600 | 默认；按钮、导航、表单、说明 |
| 普通标题 | `--heading` | 700 | 页面/区块/面板标题 |
| 品牌 / Hero | `--display` | 600 | 仅品牌名或首页主标题等强调位 |
| 代码 | `--mono` | 400 | `code` / `pre`、路径、代码展示 |

变量定义与字体加载路径见 [reference.md](reference.md)。

## 硬规则

1. **禁止**在组件 less/tsx 写死具体字体族名（如 `Inter`、`Space Grotesk`、`IBM Plex Mono`、`Noto Sans SC`）；一律 `var(--sans|--heading|--display|--mono)`。
2. 默认不写 `font-family` → 继承 `--sans`。
3. 不确定是不是「品牌/Hero」时用 `--heading`，不要用 `--display`。
4. 换加载方式（`@fontsource` / 自托管）时只改加载入口与变量/token 定义处；**不改**角色语义。

## 与 css-module-less

- 静态布局/视觉进同级 `index.less` + CSS Module → `css-module-less`
- 字族/字重选哪个变量 → 本 skill
