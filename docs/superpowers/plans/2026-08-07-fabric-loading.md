# FabricLoading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可复用组件 `FabricLoading`：以 `public/fabricIcon.png` 为原型，底图常显；窄竖状光柱仅在字形内扫过。

**Architecture:** 在 `src/components/FabricLoading/` 落盘独立模块（`types.ts` + `index.tsx` + `index.less`）。底图常驻；`.shimmer` 为窄竖状光柱，经字标 `luminance` mask 裁切后只在字形内可见（外部黑底无光柱）。Design 见 `docs/superpowers/specs/2026-08-07-fabric-loading-design.md`。

**Tech Stack:** React 19、TypeScript、CSS Modules（Less）、Vite `public/` 静态资源

**Note:** 按用户规则，实现过程中不自动 git commit。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/components/FabricLoading/types.ts` | `FabricLoadingSize`、`FabricLoadingProps` |
| `src/components/FabricLoading/index.tsx` | 组件入口；注入 `--fabric-mask` |
| `src/components/FabricLoading/index.less` | 尺寸档 + 竖状光柱扫光 + reduced-motion |
| `docs/superpowers/specs/2026-08-07-fabric-loading-design.md` | design |
| `docs/superpowers/plans/2026-08-07-fabric-loading.md` | 本 plan |

---

### Task 1: 类型定义

- [x] **Step 1: 创建 types.ts**（`FabricLoadingSize` / `FabricLoadingProps`）
- [x] **Step 2: 跳过 git commit**

---

### Task 2: 样式（窄竖状光柱 + 字形内裁切）

- [x] **Step 1: 创建 index.less**

```less
@keyframes fabricShimmer {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(120%);
  }
}

.root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  overflow: hidden;
}

.sm {
  width: 120px;
}

.md {
  width: 180px;
}

.lg {
  width: 260px;
}

.img {
  display: block;
  width: 100%;
  height: auto;
}

.shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 0%,
    transparent 44%,
    rgba(255, 255, 255, 0.3) 48%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 255, 255, 0.3) 52%,
    transparent 56%,
    transparent 100%
  );
  -webkit-mask-image: var(--fabric-mask);
  mask-image: var(--fabric-mask);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-source-type: luminance;
  mask-mode: luminance;
  pointer-events: none;
  animation: fabricShimmer 2.4s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
    opacity: 0;
  }
}
```

- [x] **Step 2: 跳过 git commit**

---

### Task 3: 组件实现

- [x] **Step 1: 创建 index.tsx**

```tsx
import styles from './index.less';
import type { FabricLoadingProps, FabricLoadingSize } from './types';

export type { FabricLoadingProps, FabricLoadingSize } from './types';

const SIZE_CLASS: Record<FabricLoadingSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const ICON_SRC = \`${import.meta.env.BASE_URL}fabricIcon.png\`;

/**
 * 品牌加载动画：fabricIcon 渐变扫光
 */
function FabricLoading({ size = 'md', className }: FabricLoadingProps) {
  const rootClassName = [styles.root, SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={rootClassName}
      role="status"
      aria-label="加载中"
      style={{ ['--fabric-mask' as string]: \`url("${ICON_SRC}")\` }}
    >
      <img className={styles.img} src={ICON_SRC} alt="" />
      <span className={styles.shimmer} aria-hidden />
    </span>
  );
}

export default FabricLoading;
```

- [x] **Step 2: 类型检查**
- [x] **Step 3: 跳过 git commit**

---

### Task 4: 手工验收

- [x] 底图常驻；窄竖状光柱只在字形内扫过；外部黑底无光柱
- [x] 时长约 2.4s；reduced-motion 停扫光

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| `FabricLoading/` 三文件落盘 | Task 1–3 |
| 竖状光柱在字形内扫光 | Task 2–3 |
| `sm`/`md`/`lg` 宽度 | Task 2–3 |
| `prefers-reduced-motion` | Task 2 |

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 明确效果：窄竖状光柱 + luminance mask，仅在字形内扫光 |
| 2026-08-07 | 回退加粗改动，恢复窄光柱字形内扫光版本 |
