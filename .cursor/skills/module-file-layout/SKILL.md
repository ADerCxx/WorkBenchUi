---
name: module-file-layout
description: >-
  Use when 新建或重构组件/业务模块目录、编写 index.tsx 入口、types.ts 类型落盘、
  type 与 interface 分工、把单文件组件拆成文件夹模块、新建或迁移自定义 React hook
  （src/hooks、useXxx）时。
---

# 模块目录与类型落盘约定

## Overview

约束 `src/**` 下**组件与业务模块如何摆放**、**自定义 hook 落盘**，以及 **`type` / `interface` 写在哪里**。  
目标：一模块一文件夹，入口符合直觉，类型边界清晰。

**Violating the letter of the rules is violating the spirit of the rules.**

---

## When to Use

- 新建页面、组件、业务子模块（可独立成模块的部分）
- 新建或迁移自定义 React hook（`useXxx`）
- 把 `Foo.tsx` 单文件拆成 `Foo/` 文件夹
- 新增 Props、领域模型、`export type`，或调整 `types.ts`
- 不确定 `interface` 该留在业务文件还是进 `types.ts`

**When NOT to use**

- 仅改样式写法/内联迁 Less → 用 `css-module-less`（本 skill 不管 class 与 `style` 取舍）
- 仅改 Markdown、配置文件
- 全局环境声明（`*.d.ts`）→ 不受本 skill 约束
- 纯接口对接模板 → 用 `api-request`

---

## 核心约定：一模块一文件夹

### 一句话

每个可独立复用或独立演进的组件/业务单元 = **一个文件夹**；**`index.tsx`（或 `index.ts`）为对外入口**。

### 推荐结构

```text
ModuleName/
├── index.tsx      # 对外入口（组件默认导出 / 业务主 API）
├── index.less     # 有布局/视觉时必有：CSS Module（写法见 css-module-less）
├── types.ts       # 较底层、可复用、对外的类型
├── constants.ts   # 可选
└── ...            # 同模块内的实现文件（helpers、子逻辑）
```

布局与视觉样式默认 **CSS Module + 同级 `index.less`**，禁止大块静态内联；完整约定见 **`css-module-less`**。  
含子组件时：

```text
ModuleName/
├── index.tsx
├── types.ts
└── components/
    └── ChildName/
        ├── index.tsx
        └── types.ts   # 仅当 Child 有独立对外/复用类型时才建
```

### 命名

| 项 | 约定 |
| --- | --- |
| 文件夹 | PascalCase（组件）或 camelCase（纯逻辑域）— 与仓库现有风格对齐 |
| 入口 | 统一 `index.tsx` / `index.ts`，不要再并列一个 `ModuleName.tsx` 当第二入口 |
| 类型文件 | 一律 `types.ts`（不用 `type.ts`、`interfaces.ts`） |

### ❌ 避免

```text
# 单文件堆在 components 下，难以长出同模块 helpers / types
components/FooBar.tsx
```

新建或明显要加类型/子逻辑时，优先：

```text
components/FooBar/index.tsx
components/FooBar/types.ts   # 需要时再建
```

已有单文件不必为「形式完美」强行搬家；**新增模块或该文件开始膨胀（类型外溢、拆 helper）时再文件夹化**。

---

## 核心约定：自定义 hook 落盘

### 一句话

可复用或跨组件的 hook → **`src/hooks/<hookName>/`**；目录名 = hook 名，**`index.ts` 为入口**。

### 推荐结构

```text
src/hooks/useFoo/
├── index.ts    # hook 实现；对外类型从 types re-export
└── types.ts    # 对外 export type（有则建）
```

| 项 | 约定 |
| --- | --- |
| 目录 | `src/hooks/<hookName>/`，`hookName` 与导出函数同名（如 `useFoo`） |
| 入口 | `index.ts`；不要 `src/hooks/useFoo.ts` 单文件堆放，也不要并列第二入口 |
| 类型 | 对外 `export type` → 同目录 `types.ts`，入口 `export type { ... } from './types'` |
| 引用 | `@/hooks/<hookName>`（别名以仓库为准） |

### 何时放组件旁 / 何时迁出

| 场景 | 放置 |
| --- | --- |
| 跨组件复用，或与具体 UI 解耦的状态/流编排 | `src/hooks/<hookName>/` |
| 仅某一组件私用且极薄（几行、无独立类型） | 可暂留该组件目录 |
| 组件旁 hook 开始膨胀、导出类型，或被第二处引用 | 迁到 `src/hooks/<hookName>/` |

### ❌ 避免

```text
# 可复用 hook 塞在业务组件旁，难发现、难复用
components/SomePanel/useFoo.ts

# hooks 根下单文件堆砌
src/hooks/useFoo.ts
```

---

## 核心约定：type 与 interface 放哪里

### 一句话

- **`export type`、对外 Props、领域模型、跨文件复用类型** → 模块内 **`types.ts`**
- **仅当前业务/组件文件使用的 `interface`** → 可以写在该文件内部
- 一旦 `interface` **被 export 或第二处引用** → 迁入 `types.ts`

### 决策表

| 场景 | 放置位置 |
| --- | --- |
| 联合类型、字面量联合、工具/交叉类型 | `types.ts` |
| 对外 Props、领域模型、树节点等共享结构 | `types.ts` |
| 仅本文件用的内部结构（含局部 Props） | 可留在 `index.tsx` / 业务 `.ts` |
| 子模块类型多且独立 | `components/<Name>/types.ts` |

### 导入与导出

- 纯类型引用使用 **`import type { ... }`**
- 对外暴露的类型从入口 **re-export**：

```typescript
// ModuleName/index.tsx
import type { FooProps } from './types';

export type { FooProps } from './types';

function Foo(props: FooProps) {
  // ...
}

export default Foo;
```

---

## 示例

### ✅ 推荐：领域类型进 types.ts

```typescript
// ModuleName/types.ts
export type TreeNode = {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: TreeNode[];
};
```

### ✅ 推荐：仅本文件用的 interface 留在组件内

```typescript
// components/Foo/index.tsx
interface FooViewState {
  expanded: boolean;
}

function Foo(/* ... */) {
  // FooViewState 仅此处使用
}
```

若 Props 要对外或被测试/父模块引用：

```typescript
// components/Foo/types.ts
export type FooProps = {
  loading: boolean;
  // ...
};
```

### ❌ 避免

```typescript
// index.tsx — 不要把 export type 写在入口/业务实现文件里
export type CardStatus = 'ok' | 'fail';
```

```typescript
// helpers.ts — 多文件共用的结构不要散落
export interface SharedOptions { /* ... */ }
```

---

## 例外

- **未命名、未 export 的内联对象类型**（函数参数旁）可留在实现处
- **极小局部类型**（如补全 `useState`）可内联；出现 `export` 或第二处引用则抽到 `types.ts`
- **`*.d.ts` / 全局增强**不受本 skill 约束
- **极薄包装组件**（无独立类型、无同级 helper）可暂保持单文件；一旦加类型或拆逻辑，再文件夹化

---

## 新建 / 重构自检

- [ ] 是否一模块一文件夹，对外入口是否为 `index.tsx` / `index.ts`？
- [ ] 可复用 hook 是否落在 `src/hooks/<hookName>/`，入口是否为 `index.ts`？
- [ ] hook 对外类型是否在同目录 `types.ts` 并从入口 re-export？
- [ ] 新增的 **`export type` / 对外 Props / 领域模型** 是否在模块 `types.ts`？
- [ ] 仅单文件内部的 `interface` 才留在业务文件？
- [ ] 跨文件复用或需 export 的 `interface` 是否已迁入 `types.ts`？
- [ ] 类型引用是否使用 `import type`？公开类型是否从入口 re-export？
- [ ] 未为「好看」无谓搬迁稳定旧文件；膨胀或新建时才文件夹化？
- [ ] 有 UI 的模块是否配备 `index.less`，且样式写法符合 `css-module-less`？

仓库内标杆路径见 [reference.md](reference.md)。
