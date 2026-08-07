# FabricLoading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可复用组件 `FabricLoading`：以 `public/fabricIcon.png` 为原型，用 CSS mask 渐变扫光表达加载中。

**Architecture:** 在 `src/components/FabricLoading/` 落盘独立模块（`types.ts` + `index.tsx` + `index.less`）。渲染带扫光的品牌图，暴露 `size`（`sm`/`md`/`lg`）与可选 `className`；无文案、无完成态、不接入业务页。Design 见 `docs/superpowers/specs/2026-08-07-fabric-loading-design.md`。

**Tech Stack:** React 19、TypeScript、CSS Modules（Less）、Vite `public/` 静态资源

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。仓库暂无组件单测基建（无 Testing Library），本轮以 `tsc`/dev 手工验收为主。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/components/FabricLoading/types.ts` | `FabricLoadingSize`、`FabricLoadingProps` |
| `src/components/FabricLoading/index.tsx` | 组件入口；默认导出 |
| `src/components/FabricLoading/index.less` | 尺寸档 + 扫光动画 + reduced-motion |
| `docs/superpowers/specs/2026-08-07-fabric-loading-design.md` | 实现后状态改为「已实现」 |
| `docs/superpowers/plans/2026-08-07-fabric-loading.md` | 本 plan |

不修改 CatalogTree / WorkbenchHeader / evaluateJump；不新增文案；资源沿用已有 `public/fabricIcon.png`。

---

### Task 1: 类型定义

**Files:**
- Create: `src/components/FabricLoading/types.ts`

- [x] **Step 1: 创建 types.ts**

```ts
export type FabricLoadingSize = 'sm' | 'md' | 'lg';

export type FabricLoadingProps = {
  /** 宽度档位；默认 md */
  size?: FabricLoadingSize;
  className?: string;
};
```

- [x] **Step 2: 跳过 git commit**（除非用户明确要求提交）

---

### Task 2: 样式（尺寸 + 扫光）

**Files:**
- Create: `src/components/FabricLoading/index.less`

- [x] **Step 1: 创建 index.less**

```less
@keyframes fabricShimmer {
  0% {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }

  100% {
    -webkit-mask-position: -100% 0;
    mask-position: -100% 0;
  }
}

.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
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
  -webkit-mask-image: linear-gradient(
    100deg,
    rgba(0, 0, 0, 0.35) 30%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0.35) 70%
  );
  mask-image: linear-gradient(
    100deg,
    rgba(0, 0, 0, 0.35) 30%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0.35) 70%
  );
  -webkit-mask-size: 200% 100%;
  mask-size: 200% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  animation: fabricShimmer 1.6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .img {
    animation: none;
    -webkit-mask-image: none;
    mask-image: none;
  }
}
```

- [x] **Step 2: 跳过 git commit**（除非用户明确要求提交）

---

### Task 3: 组件实现

**Files:**
- Create: `src/components/FabricLoading/index.tsx`

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

const ICON_SRC = `${import.meta.env.BASE_URL}fabricIcon.png`;

/**
 * 品牌加载动画：fabricIcon 渐变扫光
 */
function FabricLoading({ size = 'md', className }: FabricLoadingProps) {
  const rootClassName = [styles.root, SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClassName} role="status" aria-label="加载中">
      <img className={styles.img} src={ICON_SRC} alt="" />
    </span>
  );
}

export default FabricLoading;
```

- [x] **Step 2: 类型检查**

Run: `npx tsc -b --pretty false`
Expected: 无与 `FabricLoading` 相关的错误（全仓既有错误若有则记录，不在本任务范围扩大修复）

- [x] **Step 3: 跳过 git commit**（除非用户明确要求提交）

---

### Task 4: 手工验收 + 文档回写

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-fabric-loading-design.md`（状态）
- Optional temp: 任一已有页面临时挂载以目视（验收后**必须撤掉**，本轮不留业务接入）

- [x] **Step 1: 本地目视验收**

任选一种方式确认扫光与三档尺寸（验收完撤销临时改动）：

```tsx
import FabricLoading from '@/components/FabricLoading';

// 临时：在 Home 或 BlankPlaceholder 中挂载
<FabricLoading size="sm" />
<FabricLoading size="md" />
<FabricLoading size="lg" />
```

Run: `npm run dev`，打开对应路由。

验收清单：
- [x] 默认 / `md`：宽度约 180px，扫光循环
- [x] `sm` / `lg`：120px / 260px
- [x] 无「加载中」文案节点
- [x] 原图青→紫颜色保留
- [x] 系统开启「减少动态效果」时无扫光（或 DevTools Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`）
- [x] 未改 CatalogTree / Header 等现有 loading

- [x] **Step 2: 回写 design 状态**

将 `docs/superpowers/specs/2026-08-07-fabric-loading-design.md` 顶部：

```md
状态：设计已确认
```

改为：

```md
状态：已实现
```

并勾选该文件「验收」一节全部 checkbox。

- [x] **Step 3: 勾选本 plan 全部 Task checkbox 为 `[x]`**

- [x] **Step 4: 跳过 git commit**（除非用户明确要求提交）

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| `FabricLoading/` 三文件落盘 | Task 1–3 |
| 渐变扫光（mask） | Task 2 |
| `sm`/`md`/`lg` 宽度 | Task 2–3 |
| 无文案 / 无完成态 | Task 3 |
| `className` | Task 3 |
| `prefers-reduced-motion` | Task 2 |
| 不接入业务 loading | Task 4（临时挂载须撤） |
| design 状态回写 | Task 4 |

无 TBD/TODO 占位；类型名全程 `FabricLoadingSize` / `FabricLoadingProps`；资源路径与 Header/MainLayout 一致。
