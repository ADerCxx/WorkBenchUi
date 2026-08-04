# 正则设置页（Antd 6 CRUD Demo）

日期：2026-07-31  
状态：已实现（代码落地；`workbench-api-request` skill 扩展另轨）

## 目标

将 `RegexSettings` 从原生表格升级为 **Ant Design 6.x** 管理页 Demo：筛选 + 分页列表 + 完整 CRUD，数据走 API 层（当前内存 mock，便于后续换真实后端）。

### 成功标准

- `/regex-settings` 可完成：查询、新建、编辑、删除、行内启停；列表支持分页
- 使用 antd 6 基础组件（不引入 ProComponents）
- 列表使用 `useAntdTable`；写操作使用 `useRequest`
- `src/apis/regex/**` 签名与返回值符合 `workbench-api-request`（含分页约定）；mock 可替换为真实 `request`

## 非目标

- 不做真实后端联调与权限
- 不引入 `@ant-design/pro-components`
- 不改造工作台其它页面 UI
- 不在本规格中定义或修订通用接口/分页 Skill（见 `workbench-api-request`）
- 不改 `src/utils/request` 实现本身

## 已确认决策

| 项 | 选择 |
|----|------|
| 功能范围 | 完整 CRUD + 行内 Switch + Popconfirm 删除 |
| Mock 策略 | API 函数内内存 store，接后端时改为 `request` |
| 页面结构 | 单文件页面 + 独立 API 模块 |
| 列表请求 | `useAntdTable` |

## 技术方案

### 依赖与 Antd

- 新增 `antd@^6`；按需安装 `@ant-design/icons`
- `main.tsx`（或 `App.tsx`）包裹 `ConfigProvider`，`locale` 为 `zh_CN`
- 样式遵循 antd 6 官方推荐

### 页面结构

路径：`src/pages/RegexSettings/index.tsx`

| 区域 | 组件 | 行为 |
|------|------|------|
| 页头 | `Typography.Title` + `Button` | 「新建」打开 Modal |
| 筛选 | `Form`：名称 `Input`、启用 `Select` | `search.submit` / `search.reset` |
| 表格 | `Table` + `tableProps` | 名称、正则、说明、启用、更新时间、操作；分页用 `tableProps.pagination` |
| 启停 | 行内 `Switch` | toggle API，成功后 `refresh` |
| 操作 | `Button` + `Popconfirm` | 编辑 / 删除 |
| 表单 | `Modal` + `Form` | name、pattern、description、enabled |

校验：`name`、`pattern` 必填；`pattern` 须能被 `new RegExp` 编译，否则提示「正则语法无效」。

### 数据模型

```ts
interface RegexRule {
  id: string
  name: string
  pattern: string
  description: string
  enabled: boolean
  updatedAt: string // YYYY-MM-DD
}

interface RegexListForm {
  name?: string
  enabled?: boolean // 省略表示全部
}
```

初始数据沿用现有 4 条白名单规则，可适当复制以便演示分页。

### API（本页范围）

```
src/apis/regex/
  types.ts
  store.ts              # mock 内存数据
  list/index.ts         # RegexListApi
  create/index.ts
  update/index.ts
  delete/index.ts
  toggle/index.ts
```

- 列表：`(page, formData) => Promise<PageResult<RegexRule>>`（`PageParams` / `PageResult` 来自 `@/apis/types`，约定见 `workbench-api-request`）
- mock：过滤 → 按 `current`/`pageSize` 切片 → `{ list, total }`；短延迟模拟网络
- 写操作：`XxxApi` + `reject(new Error(...))`；成功后页面 `refresh`
- 文件注释预留真实 `url`；接后端时改为 `request`，mock store 以 `@deprecated` 处理

### 页面数据流

- `useAntdTable(RegexListApi, { form, defaultPageSize: 10 })`
- 写操作：`useRequest(..., { manual: true })` → `message.success` + `refresh()`
- 禁止手写列表 loading / 分页 state

## 实现顺序（摘要）

1. 确保分页公共类型与 `workbench-api-request` 分页约定已就绪（本规格外）
2. 安装 antd 6；`ConfigProvider`
3. 实现 `src/apis/regex/**`
4. 重写 `RegexSettings`
5. 修订路由设计文档中「仅模拟表格」表述
6. 手测 CRUD + 分页 + 筛选

## 风险与约束

- antd 6 与 `useAntdTable` 以传入 Form 实例为准；兼容问题查 ahooks / 钉小版本
- 不强制改造现有非分页接口（如 `ReportEventCategoryApi`）

## 修订记录

- 2026-07-31：初稿
- 2026-07-31：改用 `useAntdTable`；分页约定外置到 `workbench-api-request`；本规格仅覆盖正则设置页
- 2026-07-31：代码落地完成；路由设计文档已同步（`2026-07-30-routing-scaffold-design.md`）
- 2026-08-04：真实后端联调见 `2026-08-04-regex-settings-api-integration-design.md`；API 目录改为 `src/apis/regexRules/**`，mock `src/apis/regex/**` 已移除
