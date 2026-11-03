---
name: state-management-zustand
description: >-
  Use when 需要跨组件共享状态、新建或改造全局 store、写 zustand store
  （src/stores、useXxxStore）、在组件里订阅 store、写选择器、处理 store 内异步 action、
  持久化 store、给 store 写单测，或判断"该用局部 state 还是该上 store"时。
---

# Zustand 状态管理写法约定

## Overview

约束 **zustand store 如何建、放哪、怎么订阅、怎么更新、怎么测**。  
目标：store 数量可控、订阅粒度精确、更新可预测、AI 生成的代码不会掉进重渲染与状态覆盖的坑。

**Violating the letter of the rules is violating the spirit of the rules.**

前置条件：本仓 React 19 + zustand v5（v5 依赖 React 18+ 的 `useSyncExternalStore`，不需要 shim）。  
若尚未安装依赖，先装：`yarn add zustand`（版本与路径取值见 [reference.md](reference.md)）。

---

## When to Use

- 跨层级/跨模块共享客户端状态（选中项、面板状态、向导步骤、编辑器当前上下文）
- 新建 store、给 store 加 action、改 store 结构
- 在组件里读取/订阅 store
- store 内写异步流程（请求 + loading/error）
- 持久化 preferences（主题、最近选择、草稿）
- 给 store 写单元测试

**When NOT to use**

- 状态只在一个组件内用 → `useState`（本 skill 不管）
- 兄弟/父子共享且层级 ≤ 2 层 → 提升 + props
- 服务端数据取数 → `api-request`（store 只存"结果"，不承担取数缓存策略）
- 纯静态配置/常量 → `src/config`
- URL 应可分享的状态（筛选条件、分页）→ 优先放路由 query，不进 store

---

## 先判断：该不该建 store

按序过这三关，**任何一关不满足就不许建 store**。

| 关卡 | 判断 | 不满足时 |
| --- | --- | --- |
| ① 是否跨组件共享 | 只有 1 个组件用 → 不建 | 留 `useState` |
| ② 是否跨层级 | 只在相邻父子/兄弟间 → 不建 | 提升 + props / 自定义 hook |
| ③ 是否"会话级"存活 | 页面卸载就该丢 → 不建 | 局部 state 或 URL query |

三条红线（**出现即上 store**）：

- props 连续下传 **超过 2~3 层**只为把数据送到底
- 同一状态被 **3 个以上**无父子关系的组件读写
- 状态需要在**路由切换后保留**（工作台上下文、向导进度）

建之前先说一句理由（"跨越 X 层 / 被 N 个组件共享"），不要凭感觉建。

---

## 目录与命名

沿用 `module-file-layout` 的"一模块一文件夹"：

```text
src/stores/useWorkbenchStore/
├── index.ts    # create() 定义 + 导出 hook + 导出 initialState
└── types.ts    # State 类型（含 action 签名），入口 re-export
```

| 项 | 约定 |
| --- | --- |
| 目录 | `src/stores/<storeName>/` |
| 命名 | `useXxxStore`（**必须 `use` 开头**，否则 React Hooks lint 规则报错） |
| 入口 | `index.ts`，导出 `useXxxStore` 与 `initialState` |
| 类型 | State 与 action 签名写 `types.ts`，入口 `export type { XxxState } from './types'` |
| 引用 | `@/stores/useXxxStore` |

一个业务域一个 store，**禁止建"一个大 store 装全站"**。

---

## 标准骨架

```typescript
// src/stores/useWorkbenchStore/types.ts
export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export type WorkbenchState = {
  /* ---- 数据 ---- */
  rootName: string | null;
  selectedPath: string | null;
  status: AnalysisStatus;
  /* ---- action ---- */
  setRootName: (rootName: string | null) => void;
  select: (selectedPath: string | null) => void;
  reset: () => void;
};
```

```typescript
// src/stores/useWorkbenchStore/index.ts
import { create } from 'zustand';
import type { WorkbenchState } from './types';

type WorkbenchData = Pick<WorkbenchState, 'rootName' | 'selectedPath' | 'status'>;

export const initialState: WorkbenchData = {
  rootName: null,
  selectedPath: null,
  status: 'idle',
};

export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  ...initialState,

  setRootName: (rootName) => set({ rootName }),
  select: (selectedPath) => set({ selectedPath }),
  reset: () => set(initialState),
}));

export type { WorkbenchState } from './types';
```

要点：

| 规则 | 说明 |
| --- | --- |
| `create<T>()(...)` | v5 必须写**双括号**（柯里化），漏了 TS 类型推断失效 |
| 数据与 action 同层 | action 定义在 store 内，**不在组件里散落 `setState`** |
| 导出 `initialState` | 供单测与 `reset()` 复用，避免两处各写一份默认值 |
| 更新用 `set({ ... })` | 合并语义；传 `true` 是**整体替换**（会把 action 抹掉，几乎不用） |
| 不可变 | 数组/对象用 `set((s) => ({ list: [...s.list, item] }))`，禁止 `push`/直接改字段 |

---

## 订阅：选择器规则（最容易踩坑）

### ✅ 正确

```typescript
// 单值：原子选择器，只在这个字段变化时重渲染
const rootName = useWorkbenchStore((s) => s.rootName);

// action：单独取，引用稳定
const select = useWorkbenchStore((s) => s.select);

// 多值：必须包 useShallow
import { useShallow } from 'zustand/react/shallow';

const { rootName, selectedPath } = useWorkbenchStore(
  useShallow((s) => ({ rootName: s.rootName, selectedPath: s.selectedPath })),
);
```

### ❌ 禁止

```typescript
// 1. 订阅整个 store —— 任何字段变化都重渲染本组件
const state = useWorkbenchStore();

// 2. 选择器返回新对象/新数组且未加 useShallow —— v5 下会无限重渲染
const { a, b } = useWorkbenchStore((s) => ({ a: s.a, b: s.b }));
const ids = useWorkbenchStore((s) => s.list.map((i) => i.id));

// 3. 在渲染里算派生值并放进 store —— 派生值用选择器或 useMemo 算
```

**派生数据不要在 store 里存副本**（`filteredList`、`count` 这类），渲染时用选择器或 `useMemo` 算，避免双源不一致。

### 非渲染场景读取

```typescript
// 事件回调 / 异步流程里读当前值：不订阅，不触发重渲染
const { selectedPath } = useWorkbenchStore.getState();
useWorkbenchStore.getState().reset();
```

`useXxxStore.getState()` 用于**读一次**；持续监听用 `subscribe`（需 `subscribeWithSelector` 中间件才支持 selector 形式）。

---

## 异步 action

取数逻辑放 store action 内，**组件只负责触发**；调用 `src/apis` 层，不在 store 里写 `fetch`。

```typescript
loadRules: async () => {
  set({ status: 'loading', error: null });
  try {
    const rules = await queryEnabledRegexRules();
    set({ rules, status: 'success' });
  } catch (err) {
    set({ status: 'error', error: toMessage(err) });
  }
},
```

| 规则 | 说明 |
| --- | --- |
| status 三态必留 | `idle / loading / success` + `error`，组件据此渲染，禁止用布尔 `isLoading` 拼多个 |
| 错误收敛 | 只存可展示的 message，不存完整 Error 对象 |
| 竞态 | 快速切换场景（连续点、参数变化）加序号/标记，丢弃过期响应，避免旧结果覆盖新状态 |
| 与 `api-request` 边界 | store 存**结果**；请求封装、成功码判定、类型契约归 `api-request` |

---

## 持久化（可选）

只持久化**用户偏好**，不持久化请求结果与一次性状态。

```typescript
import { persist } from 'zustand/middleware';

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'wb-prefs',
      partialize: (s) => ({ theme: s.theme }), // 只落盘该落的字段
      version: 1,
    },
  ),
);
```

SSR/多标签同步、加密等需求出现时再评估，默认不做。

---

## 测试

store 是普通 JS 对象，不依赖渲染即可测（写法见 `vitest-pure-fn`）。

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkbenchStore, initialState } from './index';

beforeEach(() => {
  // merge 语义：只重置数据，保留 action（第二参数不要传 true）
  useWorkbenchStore.setState(initialState);
});

it('select 更新选中路径', () => {
  useWorkbenchStore.getState().select('/a/b.ts');
  expect(useWorkbenchStore.getState().selectedPath).toBe('/a/b.ts');
});
```

覆盖重点：**action 的状态迁移**、**不可变更新**（确认原数组未被改）、**reset 后回到 initialState**。

---

## ❌ 反模式清单

| 反模式 | 后果 | 正确做法 |
| --- | --- | --- |
| 组件里 `useXxxStore()` 整个订阅 | 任意字段变化都重渲染 | 原子选择器 |
| 选择器返回新对象不带 `useShallow` | v5 无限重渲染 | `useShallow` |
| 在组件里直接 `setState` 改数据 | 逻辑散落、难测 | action 收进 store |
| `create` 写在组件内 | 每次渲染新建 store | 模块顶层创建 |
| 把接口响应当全局缓存常驻 | 数据过期、双源 | 取数走 `api-request`，store 只存必要结果 |
| 存 DOM 节点 / ref / 函数 | 不可序列化、内存泄漏 | 只存可序列化数据 |
| store 之间互相 import 调用 | 循环依赖 | 上层用 hook/组件编排，或提升到公共 store |
| 派生值落地成字段 | 双源不一致 | 选择器 / `useMemo` 现算 |
| `setState(x, true)` 整体替换 | action 被抹掉 | 默认 merge |

---

## 自检

- [ ] 是否通过了"该不该建 store"三关？能否说清跨几层/几个组件共享？
- [ ] 目录是否 `src/stores/<useXxxStore>/{index.ts,types.ts}`？hook 名是否 `use` 开头？
- [ ] 是否 `create<T>()(...)` 双括号？是否导出 `initialState` 并在入口 re-export 类型？
- [ ] action 是否都定义在 store 内，组件里没有散落的 `setState`？
- [ ] 更新是否不可变（无 `push`/直接改字段）？
- [ ] 组件订阅是否用的原子选择器？多值是否包了 `useShallow`？
- [ ] 异步 action 是否有 status 三态 + 错误收敛 + 竞态处理？
- [ ] 是否有派生值被存成字段（双源）？
- [ ] 单测是否用 `setState(initialState)`（merge）重置，且覆盖了 action 与 reset？

项目取值（store 根路径、别名、zustand 版本、本仓标杆）见 [reference.md](reference.md)。
