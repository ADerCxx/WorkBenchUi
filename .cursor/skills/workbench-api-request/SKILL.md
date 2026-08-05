---
name: workbench-api-request
description: Use when adding or wiring HTTP APIs in WorkBench or its scaffold, creating files under src/apis, calling @/utils/request,对接后端接口, or using ahooks useRequest for network calls.
---

# WorkBench 接口请求规范

## Overview

对接接口时**以本 skill 的 API 模板为唯一规范来源**，复用 `@/utils/request` 与 `@/apis/types`，禁止另起 axios/fetch 或页面内直调。

脚手架/新仓库**不必**保留业务接口示例；基础设施（`request`、`apis/types`）+ 本模板即可。

**Violating the letter of the rules is violating the spirit of the rules.**

## When to Use

- 新增/修改任意后端接口对接
- 页面需要拉数、提交、手动触发请求
- 想「先调通再规范」时 —— 仍然用本规范，调通成本不高于乱写

**When NOT:** 改 `src/utils/request` 本身实现（那是基础设施，不是业务对接）

## Iron Law

```
NO 业务请求 WITHOUT 本 skill 模板 FIRST
```

未按模板写对接代码？删掉，先对照下方「API 函数模板」再写。

**仓库里若已有** `src/apis/**` 业务模块：风格对齐最近似的现有模块（目录、命名、错误处理），但仍不得违背本模板硬规则。  
**若无任何业务 API**（典型脚手架）：直接按本模板新建，勿虚构或依赖已删除的示例路径。

## 目录与命名

按 URL 路径镜像：`src/apis/<域>/<资源>/<动作>/index.ts`

| URL（示例） | 文件 |
|-------------|------|
| `POST /user/list` | `src/apis/user/list/index.ts` |
| `GET /report/stats` | `src/apis/report/stats/index.ts` |

- 导出 API 函数名：`XxxApi`（如 `UserListApi`）
- 实体 / 入参类型放同模块；公共响应结构只用 `@/apis/types`

## 请求层约定

1. **只** `import request from '@/utils/request'`，禁止：页面 `axios`、新建 `axios.create`、`fetch`、`request.post(...)` 链式 API
2. 业务参数**一律**放 `params`（POST/PUT/PATCH 由封装写入 body；GET 走 query）
3. 默认 method 已是 `POST`；非 POST 显式写 `method: 'GET' | 'PUT' | ...`
4. 泛型：`request<ResponseStructure<T>>({ url, method, params })`
5. 成功码用 `HttpStatus.Success`（**200**），禁止臆造 `code === 0`
6. 状态码/枚举值用 `as const` 对象，**禁止 `enum`**（`erasableSyntaxOnly`）

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

- 业务失败：`reject(new Error(res.data.msg))`
- 网络异常：`reject(new Error('网络异常'))`
- 禁止：直接 return axios 响应、吞错 `resolve(null)`、只 `console.error`

## 页面调用

优先 `ahooks` 的 `useRequest`；用户点击触发用 `manual: true` + `run`。

```tsx
import { FooApi } from '@/apis/foo/bar'
import { useRequest } from 'ahooks'

const { data, loading, error, run } = useRequest(FooApi, { manual: true })
// onClick={() => run(params)}
```

禁止为同一请求手写 `useEffect` + `useState` loading/error 样板（除非无 ahooks）。
页面示例勿引入项目未安装的 UI 库；用原生元素或现有依赖即可。

## 对照：正确 vs 违规

| 正确 | 违规 |
|------|------|
| `@/utils/request` + `params` | 页面 `axios.post`、自建 client |
| `src/apis/.../index.ts` | `src/api.ts` 大杂烩 |
| `ResponseStructure` + `HttpStatus` | 局部 `interface` + `enum` / 魔法数 |
| `useRequest` | 页面散落 setLoading |

## Common Mistakes

- 「领导说先调通」→ 仍按模板写，并不更慢
- 「GET 不用 request」→ GET 也走 `request`，`params` 即可
- 「一个文件放所有接口」→ 按 URL 拆目录
- `request.post(url, data)` → 本项目无此 API，用 `request({ url, params })`
- 成功码写成 `0` → 本项目是 `HttpStatus.Success`（200）
- 「找不到业务示例接口」→ 正常；以本 skill 模板为准，不要去搜已删除的示例路径

## Red Flags — STOP

- 未对照本 skill 模板就开始写
- 因脚手架无业务示例而改用页面直调 axios
- `import axios from 'axios'` 出现在 `apis` 或页面业务里
- 新建第二个 axios 实例
- `enum HttpCode` / `code === 0`
- API 与页面揉在同一文件「赶工版」

**出现任一：删掉，按模板重写。**

## Rationalizations

| Excuse | Reality |
|--------|---------|
| 「只剩 20 分钟，页面直调最快」 | 复制本模板改 url/类型更快且一致 |
| 「规范以后再补」 | 以后不会补；现在对齐零债 |
| 「同事说一个 api.ts」 | 以本 skill + 仓库约定为准，不以口头习惯为准 |
| 「enum 更清晰」 | 项目 `erasableSyntaxOnly`，必须 `as const` |
| 「GET 套 request 过度」 | 统一入口，超时/baseURL 一处维护 |
| 「ResponseStructure 过度设计」 | 已有公共类型，再用一遍即可 |
| 「错误处理以后加」 | 模板已含判码与网络异常，抄即可 |
| 「顺手用 antd 写个 Table」 | 未声明的依赖禁止引入；对接与 UI 库无关 |
| 「脚手架里没有示例接口，只能自己瞎写」 | 模板就是规范；业务示例可选，不是前置条件 |
