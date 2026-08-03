# WorkBench 外壳全宽布局设计

日期：2026-08-03  
状态：已实现

## 目标

解除全局 `#root` 对应用宽度的硬限制，使 Layout 外壳占满视口；各业务路由的内容区宽度与排版由各自页面自行控制。

### 成功标准

1. `#root` 横向占满可用视口（不再固定约 1126px 居中窄条）
2. 去掉全局居中与双侧边框对壳的束缚
3. `MainLayout` / `WorkbenchLayout` / `BlankLayout` 结构与路由表不变
4. 各业务页（Home、RegexSettings、Workbench 等）样式本轮不强制统一改写；页面可自行决定内容最大宽度或留白
5. 壳仍至少撑满视口高度（保留 `min-height: 100svh` 一类约束）

## 非目标

- 不统一各页内容区 `max-width` / padding
- 不改路由表、Layout 组件结构、业务逻辑与 `src/apis/**`
- 不为 Home「回退居中观感」做配套样式（留给页面后续自控）
- 不引入新的布局框架或 Antd Layout 重构

## 背景与根因

脚手架遗留全局样式（`src/styles/index.global.less`）：

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

导致无论走哪个 Layout，整站都挤在中间窄列。各 Layout 本身已是 `min-height: 100vh` 的 flex 壳，限宽来自 `#root`，而非 Layout。

## 决策

采用 **方案 1：只改 `#root`**。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 全宽粒度 | 外壳全宽，页面自控 | 对应产品选项 B |
| 改动落点 | 仅 `index.global.less` 的 `#root` | 最小 diff，根因对准 |
| 全局 `text-align: center` | 移除 | 避免表格/表单被全局居中；对齐改由页面控制 |
| Layout 统一内容 padding | 不做 | 与「各自自由发挥」冲突 |
| Home 居中回退 | 本轮不做 | 副作用可接受，后续由 Home 自行补 |

## 技术方案

修改 `#root` 为全宽壳容器，建议结果形态：

```less
#root {
  width: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

相对现状删除：`width: 1126px`、`max-width: 100%`（在 `width: 100%` 下可省略）、`margin: 0 auto`、`text-align: center`、`border-inline`。

## 影响面

| 区域 | 影响 |
|------|------|
| 三个 Layout | 自然变全宽，无需改文件 |
| RegexSettings / Workbench | 表格与内容区可横向利用全宽 |
| Home | 可能不再依赖全局居中；观感变化可接受，本轮不修 |

## 验收标准

1. 宽屏下应用左右贴边（或仅浏览器默认边距），无居中固定宽列与双侧竖线边框
2. 顶栏 / 工作台侧栏壳横向铺满
3. 路由与业务行为无回归（仅布局宽度变化）

## 修订记录

- 2026-08-03：初稿；确认方案 1（只改 `#root`，外壳全宽、页面自控）
- 2026-08-03：已按方案 1 修改 #root 为全宽壳
