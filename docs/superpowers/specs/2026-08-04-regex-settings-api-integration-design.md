# 正则设置页 API 联调

日期：2026-08-04  
状态：已实现  
前置：`2026-07-31-regex-settings-antd-crud-design.md`（Antd CRUD Demo / mock）

## 目标

将 `/regex-settings` 从内存 mock 切换为对接 `ly-innovation-challenge-svc` 正则白名单规则 CRUD；API 目录与字段以**实际后端路径与契约**为准。

### 成功标准

- 列表 / 新建 / 编辑 / 删除 / 行内启停走真实 `/regexRules/*`
- `src/apis/regexRules/**` 符合 `workbench-api-request`；目录镜像 URL
- 页面字段与后端 Vo/Dto 一致（`ruleName` / `folderName` / `filePattern` / `enableStatus` 等）
- 移除 `src/apis/regex/**` mock

### 非目标

- 不实现 `getDetail`（编辑用行数据回填）
- 不改 `src/utils/request` 实现
- 不在本轮修订 `workbench-api-request` skill 正文（后续另补）
- ~~不做文件夹扫描消费端~~（扫描消费端已由 `2026-08-04-workbench-regex-whitelist-scan-design.md` 承接；本 design 仅负责 CRUD 与字段契约）

## 已确认决策

| 项       | 选择                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| API 目录 | 按真实 URL：`src/apis/regexRules/{query,insert,update,delete}/`               |
| 字段命名 | 页面直接用后端字段，不做 name/pattern/enabled 映射                            |
| 启停     | 复用 `POST /regexRules/update`，只传 `id` + `enableStatus`；无独立 toggle API |
| 删除     | `{ ids: string[] }`                                                           |
| 详情     | 本轮不做 getDetail                                                            |
| 错误文案 | `res.data.message ?? res.data.msg`（后端为 `message`）                        |

## 后端契约（摘要）

| 操作        | 方法 + URL                |
| ----------- | ------------------------- |
| 分页列表    | `GET /regexRules/query`   |
| 新增        | `POST /regexRules/insert` |
| 修改 / 启停 | `POST /regexRules/update` |
| 删除        | `POST /regexRules/delete` |

列表 query：`ruleNameSearchParam`、`enableStatus`、`page`、`pageSize`（及可选排序）。  
分页 data 为 MyBatis-Plus `IPage`（`records` / `total` / `current` / `size`）；API 层转为 `PageResult`（`list` / `total`）。

### 数据模型（前端）

```ts
const RegexRuleEnableStatus = { Disable: 0, Enable: 1 } as const;

interface RegexRule {
  id: string;
  ruleName: string;
  folderName: string;
  filePattern: string;
  description?: string;
  enableStatus: 0 | 1;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}
```

## API 文件

```
src/apis/regexRules/
  types.ts
  query/index.ts    # RegexRulesQueryApi
  insert/index.ts   # RegexRulesInsertApi
  update/index.ts   # RegexRulesUpdateApi
  delete/index.ts   # RegexRulesDeleteApi
```

## 页面

- `RegexSettings`：改 import、表单/表格/筛选字段名；启停调 update；删除传 `ids`
- 文案去掉「内存 mock」
- 仍用 `useAntdTable` + `useRequest`

## 验收

1. 配置 `VITE_API_URL` 指向后端后，打开 `/regex-settings` 可拉列表
2. 新建 / 编辑 / 启停 / 删除成功并刷新列表
3. 非法文件正则、重名等业务错误能 `message.error` 展示后端文案
4. 仓库中无 `src/apis/regex/**` 引用

## 修订记录

- 2026-08-04：初稿（对接设计确认后落盘）
- 2026-08-04：字段由 `regexPattern` 拆为 `folderPattern` + `filePattern`；扫描消费端由 whitelist-scan design 承接
- 2026-08-04：目录字段改为字面量 `folderName`（项目根第一层目录名）；`filePattern` 仍为文件名正则
