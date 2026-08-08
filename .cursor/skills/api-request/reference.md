# 接口请求规范 — 路径与类型约定

采用本 Skill 的仓库须按下列约定提供基础设施；缺则先建设，再写业务 API。

## 默认路径（可改项）

换项目时若别名或目录不同，**只改本表**，并同步改 SKILL 内模板 import；硬规则（`params`、成功码 200、禁 axios 直调等）不变。

| 项 | 默认 |
|----|------|
| 请求封装 | `@/utils/request`（实现文件常见为 `src/utils/request/index.ts`） |
| 公共类型 | `@/apis/types`（文件常见为 `src/apis/types.ts`） |
| 业务 API 根 | `src/apis/` |
| 成功码 | `HttpStatus.Success === 200` |

## 公共类型最低要求

```typescript
export interface ResponseStructure<T> {
  msg?: string
  message?: string
  code: number // 或与 HttpStatus 推导的联合类型
  data: T
}

export const HttpStatus = {
  Success: 200,
  // 可按需扩展 Failure 等
} as const
```

可选：统一取业务错误文案的函数（兼容 `message` / `msg`）；API 模板中使用即可，不改变「失败则 reject」语义。

## 分页（可选扩展）

若页面使用 ahooks `usePagination` / `useAntdTable`，公共类型建议具备：

```typescript
export interface PageParams {
  current: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}
```

列表类 API 对页面暴露的形状与上表一致；具体 URL 与后端字段映射仍按 SKILL 目录约定落在 `src/apis/**`。
