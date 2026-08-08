---
name: api-request
description: >-
  Use when 新增或对接 HTTP 接口、在 src/apis 下落盘 API 模块、调用统一 request 封装、
  或用 ahooks useRequest 发起业务请求时。
---

# 接口请求规范

## Overview

对接接口时**以本 Skill 的 API 模板为唯一规范来源**。  
采用本 Skill 的仓库须按约定提供统一 `request` 与公共响应类型；业务代码遵循本规范，**不**为本仓现状另写一套例外。

**Violating the letter of the rules is violating the spirit of the rules.**

## 前置条件（仓库须具备）

缺任一则先补基础设施，再写业务 API（路径细则见 [reference.md](reference.md)）：

1. 统一请求封装（默认 `@/utils/request`）：支持 `request<T>({ url, method, params })`
2. 公共类型（默认 `@/apis/types`）：至少含 `ResponseStructure<T>`、`HttpStatus`（成功码 **200**）
3. 依赖：页面侧优先已安装 `ahooks`（用 `useRequest`）

有无现成业务 API 示例都不影响：基础设施 + 本模板即可开工。

## When to Use

- 新增/修改任意后端接口对接
- 页面需要拉数、提交、手动触发请求
- 想「先调通再规范」时 —— 仍然用本规范

**When NOT:** 修改 `request` 封装本身的实现（基础设施，不是业务对接）

## Iron Law

```
NO 业务请求 WITHOUT 本 skill 模板 FIRST
```

未按模板写对接代码？删掉，先对照下方「API 函数模板」再写。

已有 `src/apis/**` 业务模块时：目录/命名/错误处理风格对齐最近似模块，**仍不得违背**本模板硬规则。  
尚无业务 API 时：直接按本模板新建，勿虚构不存在的示例模块。

## 目录与命名

按 URL 路径镜像：`src/apis/<域>/<资源>/<动作>/index.ts`

| URL（示例） | 文件 |
|-------------|------|
| `POST /user/list` | `src/apis/user/list/index.ts` |
| `GET /report/stats` | `src/apis/report/stats/index.ts` |

- 导出 API 函数名：`XxxApi`（如 `UserListApi`）
- 实体 / 入参类型放同模块；公共响应结构只用公共 types 模块

## 请求层约定

1. **只**通过统一 `request` 发请求，禁止：页面 `axios`、新建 `axios.create`、`fetch`、`request.post(...)` 链式 API
2. 业务参数**一律**放 `params`（POST/PUT/PATCH 由封装写入 body；GET 走 query）
3. 默认 method 为 `POST`；非 POST 显式写 `method: 'GET' | 'PUT' | ...`
4. 泛型：`request<ResponseStructure<T>>({ url, method, params })`
5. 成功码用 `HttpStatus.Success`（**200**），禁止臆造 `code === 0`
6. 状态码/枚举值用 `as const` 对象，**禁止 `enum`**（兼容 `erasableSyntaxOnly`）

## API 函数模板

```typescript
import { HttpStatus, type ResponseStructure } from '@/apis/types'
import request from '@/utils/request'

export interface FooParams { /* ... */ }
export interface Foo { /* ... */ }

/** 简要说明 */
export async function FooApi(params: FooParams = {}) {
  try {
    const res = await request<ResponseStructure<Foo>>({
      url: '/foo/bar',
      method: 'POST',
      params,
    })
    if (res.data.code === HttpStatus.Success) {
      return res.data.data
    }
    return Promise.reject(new Error(res.data.msg))
  }
  catch {
    return Promise.reject(new Error('网络异常'))
  }
}
```

- 业务失败：`reject(new Error(res.data.msg))`（若公共类型提供统一取文案函数，可用之，语义不变）
- 网络异常：`reject(new Error('网络异常'))`
- 禁止：直接 return 原始响应、吞错 `resolve(null)`、只 `console.error`

## 页面调用

优先 `ahooks` 的 `useRequest`；用户点击触发用 `manual: true` + `run`。

```tsx
import { FooApi } from '@/apis/foo/bar'
import { useRequest } from 'ahooks'

const { data, loading, error, run } = useRequest(FooApi, { manual: true })
// onClick={() => run(params)}
```

禁止为同一请求手写 `useEffect` + `useState` loading/error 样板（除非未安装 ahooks）。  
页面示例勿引入仓库未声明的 UI 库。

## 对照：正确 vs 违规

| 正确 | 违规 |
|------|------|
| 统一 `request` + `params` | 页面 `axios.post`、自建 client |
| `src/apis/.../index.ts` | `src/api.ts` 大杂烩 |
| `ResponseStructure` + `HttpStatus` | 局部 `interface` + `enum` / 魔法数 |
| `useRequest` | 页面散落 setLoading |

## Common Mistakes

- 「先调通再规范」→ 仍按模板写
- 「GET 不用 request」→ GET 也走 `request`，`params` 即可
- 「一个文件放所有接口」→ 按 URL 拆目录
- `request.post(url, data)` → 用 `request({ url, params })`
- 成功码写成 `0` → 使用 `HttpStatus.Success`（200）
- 「没有业务示例接口」→ 以本模板为准新建

## Red Flags — STOP

- 未对照本 skill 模板就开始写
- 因暂无业务 API 示例而改用页面直调 axios
- `import axios from 'axios'` 出现在 `apis` 或页面业务里
- 新建第二个 axios 实例
- `enum HttpCode` / `code === 0`
- API 与页面揉在同一文件「赶工版」
- 为迁就仓内旧写法而改本 Skill 或另起例外规范

**出现任一：删掉业务侧违规写法，按模板重写；缺基础设施则先补齐。**

## Rationalizations

| Excuse | Reality |
|--------|---------|
| 「页面直调最快」 | 复制本模板改 url/类型更快且一致 |
| 「规范以后再补」 | 现在按模板写，避免后续返工 |
| 「一个 api.ts 更省事」 | 以本 skill 目录约定为准 |
| 「enum 更清晰」 | 必须 `as const` |
| 「GET 套 request 过度」 | 统一入口，超时/baseURL 一处维护 |
| 「ResponseStructure 过度设计」 | 公共类型再用一遍即可 |
| 「错误处理以后加」 | 模板已含判码与网络异常 |
| 「顺手引入未声明的 UI 库」 | 禁止；对接与 UI 库无关 |
| 「没有示例只能瞎写」 | 模板即规范 |
| 「这仓以前不是这样」 | 以本 Skill 为准；改代码对齐规范，不改规范迁就旧代码 |
