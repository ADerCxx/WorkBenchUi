# FabricLoading 品牌加载动画

日期：2026-08-07  
状态：已实现  
参考：`src/pages/Workbench/components/evaluateJump`（logo mask 灌满加载）；品牌图 `public/fabricIcon.png`

## 目标

提供可复用的品牌加载组件 `FabricLoading`：以 `fabricIcon.png` 为原型，用渐变扫光表达「加载中」，供项目各处按需挂载。

### 成功标准

1. `src/components/FabricLoading/` 可独立导入；默认 `size="md"` 时扫光循环
2. `sm` / `md` / `lg` 三档宽度正确，PNG 比例不失真
3. 无文案、无内建完成态；显示与否由调用方条件渲染控制
4. 支持根节点 `className` 拼接
5. `prefers-reduced-motion: reduce` 时停扫光，图标保持正常可见
6. 本轮不改 CatalogTree / Header 等现有 loading 接入点

## 非目标

- 不做 evaluateJump 式 mask 灌满 / 完成态跳转
- 不附带「加载中…」文案或自定义 tip
- 不重绘 SVG 字标
- 不接入具体业务页面（仅交付组件）

## 背景

`evaluateJump` 用督导 logo 做 CSS mask「灌满」过渡。本项目品牌资产为横向字标 `fabricIcon.png`（青→紫渐变、黑底）。经对比选定 **渐变扫光**：保留原图颜色，一道高光循环扫过，更贴合字标形态。

## 决策

采用 **方案 1：`<img>` + CSS `mask` 扫光**。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 落盘 | `src/components/FabricLoading/` | 与 `MarkdownPreview` 同级，全局复用 |
| 视觉 | 渐变扫光（预览 B） | 非 mask 灌满 / 呼吸 / clip 揭开 |
| 文案 | 无 | 纯视觉 |
| 尺寸 | `sm` \| `md` \| `lg` | 默认 `md`；控 width，高自适应 |
| 资源 | `public/fabricIcon.png` | `${import.meta.env.BASE_URL}fabricIcon.png` |
| 完成态 | 无 | 调用方卸载组件即结束 |
| 动效偏好 | 尊重系统设置 | reduced-motion 时停动画 |
| 业务接入 | 本轮不做 | YAGNI |

## 技术方案

### 改动文件

| 文件 | 变更 |
|------|------|
| `src/components/FabricLoading/index.tsx` | 组件入口：默认导出 |
| `src/components/FabricLoading/index.less` | CSS Module：尺寸档 + 扫光 keyframes + reduced-motion |
| `src/components/FabricLoading/types.ts` | `FabricLoadingSize`、`FabricLoadingProps` |

### 结构

```text
src/components/FabricLoading/
├── index.tsx
├── index.less
└── types.ts
```

### API

```ts
type FabricLoadingSize = 'sm' | 'md' | 'lg';

type FabricLoadingProps = {
  size?: FabricLoadingSize; // 默认 'md'
  className?: string;
};
```

行为要点：
- 渲染扫光中的 `fabricIcon.png`
- `role="status"` + `aria-label="加载中"`
- 不自带全屏遮罩；黑底来自 PNG

### 尺寸

| size | width |
|------|--------|
| `sm` | 120px |
| `md` | 180px |
| `lg` | 260px |

### 样式

- 根：`inline-flex`；图片 `display:block; width:100%; height:auto`
- 扫光：`mask-image: linear-gradient(...)` 横向位移，约 1.6s `linear` infinite（对齐 brainstorm 预览 B）
- `@media (prefers-reduced-motion: reduce)`：`animation: none`，移除 mask，图标静态全可见

### 用法

```tsx
import FabricLoading from '@/components/FabricLoading';

{loading ? <FabricLoading size="md" /> : null}
```

## 验收

- [x] 组件可从 `@/components/FabricLoading` 导入并渲染
- [x] 三档尺寸宽度符合上表
- [x] 扫光动画连续、原图颜色保留
- [x] 无文案节点
- [x] reduced-motion 下无扫光
- [x] 未修改业务侧现有 loading UI

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 实现落地；a11y 采用 role="status"（对齐 plan） |
