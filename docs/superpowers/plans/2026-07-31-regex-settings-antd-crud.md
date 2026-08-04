# 正则设置页 Antd CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/regex-settings` 升级为 Antd 6 管理页 Demo（筛选、分页列表、CRUD、行内启停），数据经 `src/apis/regex/**` 内存 mock，可替换为真实 `request`。

**Architecture:** 单文件页面 `RegexSettings` + `useAntdTable` 绑列表/筛选；写操作用 `useRequest` + `refresh`。API 按 URL 镜像拆目录，列表返回 `PageResult`，mock 内过滤与切片。

**Tech Stack:** React 19、antd 6、ahooks（`useAntdTable` / `useRequest`）、现有 `@/utils/request` 约定（本页 mock 暂不调用）。

**前置（本 plan 不包含）：** `@/apis/types` 已具备 `PageParams`、`PageResult`，且 `workbench-api-request` 已含分页约定。未就绪时先完成该前置再执行本 plan。

**Spec:** `docs/superpowers/specs/2026-07-31-regex-settings-antd-crud-design.md`

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加 `antd@^6`、`@ant-design/icons` |
| `src/main.tsx` | `ConfigProvider` + `zh_CN` |
| `src/apis/regex/types.ts` | `RegexRule`、筛选项与写操作入参 |
| `src/apis/regex/store.ts` | mock 内存列表与延迟 |
| `src/apis/regex/list/index.ts` | `RegexListApi` |
| `src/apis/regex/create/index.ts` | `RegexCreateApi` |
| `src/apis/regex/update/index.ts` | `RegexUpdateApi` |
| `src/apis/regex/delete/index.ts` | `RegexDeleteApi` |
| `src/apis/regex/toggle/index.ts` | `RegexToggleApi` |
| `src/pages/RegexSettings/index.tsx` | 管理页 UI |
| `docs/superpowers/specs/2026-07-30-routing-scaffold-design.md` | 去掉「仅模拟表格」表述 |

---

### Task 1: 安装 antd 6 并接入 ConfigProvider

**Files:**
- Modify: `package.json`（经 npm）
- Modify: `src/main.tsx`

- [ ] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
npm install antd@^6 @ant-design/icons
```

Expected: `package.json` 出现 `antd`、`@ant-design/icons`，安装无报错。

- [ ] **Step 2: 根节点包裹 ConfigProvider**

将 `src/main.tsx` 改为：

```tsx
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.global.less'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: 确认类型检查可通过（至少 main 无报错）**

```powershell
cd D:\myComponent\WorkBench
npx tsc -b --pretty false
```

Expected: 与本改动相关无新增错误（若仓库另有既有错误，记录但不在本 Task 扩大修复范围）。

- [ ] **Step 4: Commit（仅当用户明确要求提交时执行）**

```powershell
git add package.json package-lock.json src/main.tsx
git commit -m "chore: add antd 6 and ConfigProvider zh_CN"
```

---

### Task 2: Regex mock store 与类型

**Files:**
- Create: `src/apis/regex/types.ts`
- Create: `src/apis/regex/store.ts`

- [ ] **Step 1: 创建类型文件**

`src/apis/regex/types.ts`：

```ts
export interface RegexRule {
  id: string
  name: string
  pattern: string
  description: string
  enabled: boolean
  updatedAt: string
}

export interface RegexListForm {
  name?: string
  enabled?: boolean
}

export interface RegexCreateParams {
  name: string
  pattern: string
  description?: string
  enabled?: boolean
}

export interface RegexUpdateParams {
  id: string
  name: string
  pattern: string
  description?: string
  enabled?: boolean
}

export interface RegexToggleParams {
  id: string
  enabled: boolean
}

export interface RegexDeleteParams {
  id: string
}
```

- [ ] **Step 2: 创建 mock store**

`src/apis/regex/store.ts`：

```ts
import type { RegexRule } from './types'

const INITIAL: RegexRule[] = [
  {
    id: '1',
    name: 'Skills 目录',
    pattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
    description: '匹配 .cursor/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '2',
    name: 'Rules 目录',
    pattern: String.raw`(?:^|/)\.cursor/rules(?:/|$)`,
    description: '匹配 .cursor/rules 约定根',
    enabled: true,
    updatedAt: '2026-07-28',
  },
  {
    id: '3',
    name: 'Agents Skills',
    pattern: String.raw`(?:^|/)\.agents/skills(?:/|$)`,
    description: '匹配 .agents/skills 约定根',
    enabled: true,
    updatedAt: '2026-07-29',
  },
  {
    id: '4',
    name: '忽略 node_modules',
    pattern: String.raw`(?:^|/)node_modules(?:/|$)`,
    description: '排除依赖目录（示例，可作黑名单扩展）',
    enabled: false,
    updatedAt: '2026-07-30',
  },
]

/** @deprecated 接真实后端后移除；仅供 mock API */
let rows: RegexRule[] = INITIAL.map((r) => ({ ...r }))

/** mock 网络延迟 */
export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function getRegexStore(): RegexRule[] {
  return rows
}

export function setRegexStore(next: RegexRule[]): void {
  rows = next
}

export function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

为便于演示分页，可在 `INITIAL` 后再追加 6～8 条副本（改 `id`/`name`），使总数 > `defaultPageSize`（10）或将页面 `defaultPageSize` 设为 `2` 做演示；推荐 **defaultPageSize=10** 且 seed ≥ 12 条。

- [ ] **Step 3: Commit（仅当用户明确要求提交时执行）**

```powershell
git add src/apis/regex/types.ts src/apis/regex/store.ts
git commit -m "feat(regex): add mock store and types"
```

---

### Task 3: Regex API 函数（list / create / update / delete / toggle）

**Files:**
- Create: `src/apis/regex/list/index.ts`
- Create: `src/apis/regex/create/index.ts`
- Create: `src/apis/regex/update/index.ts`
- Create: `src/apis/regex/delete/index.ts`
- Create: `src/apis/regex/toggle/index.ts`

- [ ] **Step 1: 实现 RegexListApi**

`src/apis/regex/list/index.ts`（真实 url 预留：`POST /regex/list`）：

```ts
import type { PageParams, PageResult } from '@/apis/types'
import { delay, getRegexStore } from '../store'
import type { RegexListForm, RegexRule } from '../types'

/**
 * 正则白名单分页列表
 * 真实接口：POST /regex/list
 */
export async function RegexListApi(
  page: PageParams,
  formData: RegexListForm = {},
): Promise<PageResult<RegexRule>> {
  try {
    await delay()
    const nameKeyword = formData.name?.trim().toLowerCase()
    let filtered = getRegexStore()
    if (nameKeyword) {
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(nameKeyword))
    }
    if (typeof formData.enabled === 'boolean') {
      filtered = filtered.filter((r) => r.enabled === formData.enabled)
    }
    const { current, pageSize } = page
    const start = (current - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)
    return { list, total: filtered.length }
  } catch {
    return Promise.reject(new Error('网络异常'))
  }
}
```

- [ ] **Step 2: 实现写操作 API**

`src/apis/regex/create/index.ts`：

```ts
import { delay, getRegexStore, setRegexStore, today } from '../store'
import type { RegexCreateParams, RegexRule } from '../types'

/** 新建；真实接口：POST /regex/create */
export async function RegexCreateApi(params: RegexCreateParams): Promise<RegexRule> {
  try {
    await delay()
    const row: RegexRule = {
      id: String(Date.now()),
      name: params.name,
      pattern: params.pattern,
      description: params.description ?? '',
      enabled: params.enabled ?? true,
      updatedAt: today(),
    }
    setRegexStore([row, ...getRegexStore()])
    return row
  } catch {
    return Promise.reject(new Error('网络异常'))
  }
}
```

`src/apis/regex/update/index.ts`：

```ts
import { delay, getRegexStore, setRegexStore, today } from '../store'
import type { RegexRule, RegexUpdateParams } from '../types'

/** 更新；真实接口：POST /regex/update */
export async function RegexUpdateApi(params: RegexUpdateParams): Promise<RegexRule> {
  try {
    await delay()
    const rows = getRegexStore()
    const idx = rows.findIndex((r) => r.id === params.id)
    if (idx < 0) {
      return Promise.reject(new Error('记录不存在'))
    }
    const next: RegexRule = {
      ...rows[idx],
      name: params.name,
      pattern: params.pattern,
      description: params.description ?? '',
      enabled: params.enabled ?? rows[idx].enabled,
      updatedAt: today(),
    }
    const copy = rows.slice()
    copy[idx] = next
    setRegexStore(copy)
    return next
  } catch (e) {
    if (e instanceof Error && e.message === '记录不存在') {
      return Promise.reject(e)
    }
    return Promise.reject(new Error('网络异常'))
  }
}
```

`src/apis/regex/delete/index.ts`：

```ts
import { delay, getRegexStore, setRegexStore } from '../store'
import type { RegexDeleteParams } from '../types'

/** 删除；真实接口：POST /regex/delete */
export async function RegexDeleteApi(params: RegexDeleteParams): Promise<void> {
  try {
    await delay()
    setRegexStore(getRegexStore().filter((r) => r.id !== params.id))
  } catch {
    return Promise.reject(new Error('网络异常'))
  }
}
```

`src/apis/regex/toggle/index.ts`：

```ts
import { delay, getRegexStore, setRegexStore, today } from '../store'
import type { RegexRule, RegexToggleParams } from '../types'

/** 启停；真实接口：POST /regex/toggle */
export async function RegexToggleApi(params: RegexToggleParams): Promise<RegexRule> {
  try {
    await delay()
    const rows = getRegexStore()
    const idx = rows.findIndex((r) => r.id === params.id)
    if (idx < 0) {
      return Promise.reject(new Error('记录不存在'))
    }
    const next: RegexRule = {
      ...rows[idx],
      enabled: params.enabled,
      updatedAt: today(),
    }
    const copy = rows.slice()
    copy[idx] = next
    setRegexStore(copy)
    return next
  } catch (e) {
    if (e instanceof Error && e.message === '记录不存在') {
      return Promise.reject(e)
    }
    return Promise.reject(new Error('网络异常'))
  }
}
```

- [ ] **Step 3: 快速自检 list 返回形状（Node 不可直接跑 TS 时跳过，改用页面手测）**

可选：在实现页后于浏览器 Network/控制台确认 `list`/`total`。

- [ ] **Step 4: Commit（仅当用户明确要求提交时执行）**

```powershell
git add src/apis/regex
git commit -m "feat(regex): add mock list and CRUD APIs"
```

---

### Task 4: 重写 RegexSettings 页面

**Files:**
- Modify: `src/pages/RegexSettings/index.tsx`

- [ ] **Step 1: 用 Antd + useAntdTable 重写页面**

完整替换 `src/pages/RegexSettings/index.tsx` 为（可按项目 Prettier 微调）：

```tsx
import { RegexCreateApi } from '@/apis/regex/create'
import { RegexDeleteApi } from '@/apis/regex/delete'
import { RegexListApi } from '@/apis/regex/list'
import { RegexToggleApi } from '@/apis/regex/toggle'
import type { RegexListForm, RegexRule } from '@/apis/regex/types'
import { RegexUpdateApi } from '@/apis/regex/update'
import { useAntdTable, useRequest } from 'ahooks'
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'

/**
 * 校验正则字面量是否可编译
 */
function validatePattern(_: unknown, value: string) {
  if (!value) {
    return Promise.reject(new Error('请输入正则'))
  }
  try {
    // eslint-disable-next-line no-new
    new RegExp(value)
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error('正则语法无效'))
  }
}

/**
 * 正则表达式设置：扫描文件夹白名单（Antd CRUD Demo）
 */
function RegexSettings() {
  const [filterForm] = Form.useForm<RegexListForm>()
  const [editForm] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RegexRule | null>(null)

  const { tableProps, search, refresh } = useAntdTable(RegexListApi, {
    form: filterForm,
    defaultPageSize: 10,
  })

  const { run: runCreate, loading: creating } = useRequest(RegexCreateApi, {
    manual: true,
    onSuccess: () => {
      message.success('已新建')
      setOpen(false)
      refresh()
    },
    onError: (e) => message.error(e.message),
  })

  const { run: runUpdate, loading: updating } = useRequest(RegexUpdateApi, {
    manual: true,
    onSuccess: () => {
      message.success('已保存')
      setOpen(false)
      refresh()
    },
    onError: (e) => message.error(e.message),
  })

  const { run: runDelete } = useRequest(RegexDeleteApi, {
    manual: true,
    onSuccess: () => {
      message.success('已删除')
      refresh()
    },
    onError: (e) => message.error(e.message),
  })

  const { run: runToggle } = useRequest(RegexToggleApi, {
    manual: true,
    onSuccess: () => {
      message.success('已更新启停')
      refresh()
    },
    onError: (e) => message.error(e.message),
  })

  const openCreate = () => {
    setEditing(null)
    editForm.resetFields()
    editForm.setFieldsValue({ enabled: true })
    setOpen(true)
  }

  const openEdit = (row: RegexRule) => {
    setEditing(row)
    editForm.setFieldsValue(row)
    setOpen(true)
  }

  const submitEdit = async () => {
    const values = await editForm.validateFields()
    if (editing) {
      runUpdate({ id: editing.id, ...values })
    } else {
      runCreate(values)
    }
  }

  const columns: ColumnsType<RegexRule> = [
    { title: '名称', dataIndex: 'name', width: 160 },
    {
      title: '正则',
      dataIndex: 'pattern',
      ellipsis: true,
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean, row) => (
        <Switch
          checked={enabled}
          onChange={(checked) => runToggle({ id: row.id, enabled: checked })}
        />
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 120 },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该规则？" onConfirm={() => runDelete({ id: row.id })}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <section style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            正则表达式设置
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            用于扫描文件夹的白名单规则（Demo，数据为内存 mock）。
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={openCreate}>
          新建
        </Button>
      </Space>

      <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="name" label="名称">
          <Input allowClear placeholder="关键字" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="enabled" label="启用">
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 120 }}
            options={[
              { label: '启用', value: true },
              { label: '停用', value: false },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={search.submit}>
              查询
            </Button>
            <Button onClick={search.reset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table<RegexRule> rowKey="id" columns={columns} {...tableProps} />

      <Modal
        title={editing ? '编辑规则' : '新建规则'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={submitEdit}
        confirmLoading={creating || updating}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="pattern"
            label="正则"
            rules={[{ required: true, validator: validatePattern }]}
          >
            <Input.TextArea rows={3} placeholder="正则字面量，勿包首尾斜杠" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}

export default RegexSettings
```

注意：若项目 antd 6 无 `destroyOnHidden`，改为文档推荐的等价 prop（如仍支持 `destroyOnClose` 则用之）。

- [ ] **Step 2: 本地手测**

```powershell
cd D:\myComponent\WorkBench
npm run dev
```

打开 `/regex-settings`，验证：

1. 列表加载与分页
2. 名称 / 启用筛选
3. 新建、编辑、删除
4. 行内 Switch
5. 非法正则提交被拦住

- [ ] **Step 3: Commit（仅当用户明确要求提交时执行）**

```powershell
git add src/pages/RegexSettings/index.tsx
git commit -m "feat(regex-settings): antd 6 CRUD with useAntdTable"
```

---

### Task 5: 同步路由设计文档表述

**Files:**
- Modify: `docs/superpowers/specs/2026-07-30-routing-scaffold-design.md`

- [x] **Step 1: 修订「仅模拟表格 / 无增删改」相关句**

将非目标与数据流中关于「正则设置页暂不做增删改查与持久化（仅模拟表格）」「正则设置页数据为页面内常量模拟，无接口」改为指向新规格，例如：

- 非目标中删除或改写该条，注明：正则设置页 CRUD 见 `2026-07-31-regex-settings-antd-crud-design.md`
- 「实现要点」中「模拟数据表格」改为「Antd 管理页（mock API）」
- 修订记录追加一条：2026-07-31 正则页升级为 Antd CRUD Demo

- [ ] **Step 2: Commit（仅当用户明确要求提交时执行）**

```powershell
git add docs/superpowers/specs/2026-07-30-routing-scaffold-design.md
git commit -m "docs: update routing spec for regex settings CRUD"
```

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| antd 6 + ConfigProvider | Task 1 |
| regex types / mock store | Task 2 |
| list 分页 + CRUD APIs | Task 3 |
| useAntdTable 页面 CRUD | Task 4 |
| 修订路由文档表述 | Task 5 |
| workbench-api-request 分页说明 | **不在本 plan**（前置） |
| 通用管理页 Skill | **不在本 plan**（可另开） |

## 不在本 plan

- 扩展 `.cursor/skills/workbench-api-request`（含 `PageParams`/`PageResult` 类型落地）
- 新增 `antd-admin-crud-page` Skill
- 真实后端联调、git push

## 修订记录

- 2026-08-04：真实后端联调已另开 `2026-08-04-regex-settings-api-integration`；本 plan 的 `src/apis/regex/**` mock 路径已废弃
