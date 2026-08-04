# 工作台 — 正则白名单驱动扫描

日期：2026-08-04  
状态：已实现  
前置：

- `2026-08-03-workbench-pick-folder-design.md`（硬编码约定根扫描）
- `2026-08-04-regex-settings-api-integration-design.md`（`/regexRules` CRUD）

## 目标

将 `/workbench`「选择文件夹」改为由启用中的白名单规则驱动：

- `folderName`：项目根下**第一层目录名**（字面量，非正则）
- `filePattern`：该目录树内**文件名**格式正则
- 库内可有内置默认规则；前端只消费 `enableStatus === 启用` 的规则

### 成功标准

1. 选项目根后，仅按**启用规则**扫描
2. 只进入根下与某条规则 `folderName` 匹配（忽略大小写）的第一层目录；其内文件名命中对应 `filePattern` 才收录
3. 无启用/无可用规则时不扫盘，并有明确空态/提示
4. 设置页可维护目录名 + 文件正则
5. 左树 + 右原文预览行为与现网一致（仅数据来源变）

### 非目标

- 后端表结构 / Java 校验实现（同事负责）
- 硬编码跳过 `node_modules` / `.git`
- Markdown 渲染、关系图、规则本地缓存
- 独立「拉全量启用规则」新 URL（沿用 query + 翻页）

## 已确认决策

| 项 | 选择 |
| --- | --- |
| 目录字段 | `folderName`：项目根第一层目录名，字面量，忽略大小写 |
| 文件字段 | `filePattern`：仅匹配**文件名**（非整段相对路径） |
| 多规则关系 | OR：同目录多条文件正则任一命中即可；不同目录各自进入 |
| 硬编码约定根 | 移除；由启用规则的 `folderName` 决定 |
| 拉规则 | 扫描前查询启用规则；失败则不扫盘 |

## 数据契约（前端先行）

```ts
interface RegexRule {
  id: string;
  ruleName: string;
  folderName: string; // 第一层目录名，如 .cursor、docs
  filePattern: string; // 文件名正则，如 \.mdc?$
  description?: string;
  enableStatus: 0 | 1;
}
```

- 设置页：`folderName` 必填 trim；`filePattern` 必填且可 `new RegExp` 编译
- 后端字段由同事对齐

## 扫描语义

```
选择项目根
  → 拉取全部启用规则并编译（空目录名 / 非法文件正则 → 跳过该条）
  → 无可用规则 → 空结果 + 提示
  → 遍历项目根第一层目录：
      · 名称与某条规则 folderName 忽略大小写相等 → 进入
      · 该子树内递归全部目录；文件名命中对应规则 filePattern → 读入
  → RawFile[] → buildTree / 预览
```

## 前端改动面

| 区域 | 改动 |
| --- | --- |
| `apis/regexRules/types` | `folderName` + `filePattern` |
| `RegexSettings` | 目录名 + 文件正则 |
| `whitelistMatch` / `scanByWhitelist` | 第一层目录名匹配 + 文件名正则 |
| `Workbench/index` | 拉启用规则再扫描 |

## 错误与空态

| 情况 | 行为 |
| --- | --- |
| 拉规则失败 | `message.error`；不扫盘；保留上次成功列表 |
| 无可用规则 | 不扫盘；左栏「无启用白名单规则」 |
| 单条无效 | 跳过并 warning；其余继续 |
| 单文件读失败 | 跳过该文件 |

## 验收标准

1. 启用 `folderName=.cursor` + `filePattern=\.mdc?$` → 仅出现 `.cursor` 下命中文件名的节点
2. 全部停用 → 选文件夹无文件 + 提示
3. 设置页可维护两字段（后端就绪后联调）

## 修订记录

| 日期 | 摘要 |
| --- | --- |
| 2026-08-04 | 初稿：双正则 folder+file |
| 2026-08-04 | 实现白名单扫描接入；移除硬编码约定根与业务单测 |
| 2026-08-04 | 目录改为字面量 `folderName`（仅根下第一层）；`filePattern` 仅匹配文件名 |
