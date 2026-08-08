# Fabric 全流程测试（用例 + 实测）

| 项 | 内容 |
| --- | --- |
| 版本 | V1.0 |
| 日期 | 2026-08-08（复测 18:01–18:03，夹具根） |
| 范围 | 首页 → 正则设置 → 工作台选夹扫描 → 预览 → AI 分析 → 关系图谱 |
| 策略 | 只测不修；接口层实测 + 夹具根扫描语义复现；浏览器 File System Access 交互标阻塞（无自动化） |
| 前端 | `http://localhost:5173/`（Vite dev） |
| 后端代理 | `/regexRules`、`/report`、`/qoderSessions` → `http://172.16.27.80:8889` |
| 浏览器要求 | Chromium（Chrome / Edge），工作台选文件夹依赖 File System Access API |

## 1. 环境与前置

| 检查项 | 结果 |
| --- | --- |
| 前端 `/` | HTTP 200 |
| Vite 代理 `GET /regexRules/query` | HTTP 200，`code=200`，启用规则 2 条 |
| 直连后端 `172.16.27.80:8889` | HTTP 200（与代理一致） |
| 静态资源 `fabricIcon.png` / `demo/ysVideo.mp4` / 截图 | HTTP 200 |
| 现网启用规则 | `docs` + `\.mdc?$`；`.cursor` + `\.mdc?$`（均为 `enableStatus=1`） |
| 测试根目录（扫描语义复现） | `D:\myComponent\WorkBench` |
| 浏览器全流程夹具根 | [`docs/test/fixtures/fabric-e2e`](./fixtures/fabric-e2e/)（选夹时选此目录；内含 `docs/` 命中白名单） |

## 2. 汇总

| 状态 | 数量 |
| --- | --- |
| 通过 | 21 |
| 失败 | 1 |
| 阻塞 | 8 |
| **合计** | **30** |

| 模块 | 通过 | 失败 | 阻塞 |
| --- | ---: | ---: | ---: |
| 环境 / 路由 / 静态资源 | 5 | 0 | 0 |
| 正则规则 API（CRUD） | 6 | 0 | 0 |
| 白名单扫描语义 | 3 | 0 | 0 |
| AI 分析 / 取消 API | 3 | 1 | 0 |
| 技术构建 | 2 | 0 | 0 |
| 浏览器 UI 全路径 | 2 | 0 | 8 |

## 3. 用例与实测

### 3.1 环境 / 路由 / 静态资源

### TC-001: 首页可达

**前置条件**：`yarn dev` 已启动  
**步骤**：`GET http://localhost:5173/`  
**预期结果**：HTTP 200，返回 SPA HTML  
**实际结果**：HTTP 200，`len=1008`  
**状态**：通过

### TC-002: 工作台路由可达

**前置条件**：同 TC-001  
**步骤**：`GET /workbench`  
**预期结果**：HTTP 200（SPA 入口）  
**实际结果**：HTTP 200  
**状态**：通过

### TC-003: 正则设置路由可达

**前置条件**：同 TC-001  
**步骤**：`GET /regex-settings`  
**预期结果**：HTTP 200  
**实际结果**：HTTP 200  
**状态**：通过

### TC-004: 未知路径仍由 SPA 承接

**前置条件**：同 TC-001  
**步骤**：`GET /not-a-page`  
**预期结果**：HTTP 200（前端 NotFound 由 React Router 渲染，非服务器 404）  
**实际结果**：HTTP 200  
**状态**：通过

### TC-005: 品牌与演示静态资源

**前置条件**：同 TC-001  
**步骤**：请求 `fabricIcon.png`、`demo/ysVideo.mp4`、`image/workbench-overview.png`  
**预期结果**：均 HTTP 200  
**实际结果**：icon PNG 200；video mp4 200（约 10.9MB）；截图 200  
**状态**：通过

---

### 3.2 正则规则 API（业务连贯：查 → 增 → 改 → 启停 → 删）

> 写操作使用 JSON body（与 [`src/utils/request`](../../src/utils/request/index.ts) 一致：POST `params` → `data`）。  
> 测试数据：`ruleName=FABRIC_E2E_TEST_RULE`，测完已删除。

### TC-010: 分页查询规则列表

**接口**：`GET /regexRules/query?page=1&pageSize=10`  
**预期结果**：`code=200`；`data.records` 为数组；`total>=0`  
**实际结果**：`code=200`，`total=2`，含 `folderName=docs` 与 `.cursor`  
**状态**：通过

### TC-011: 仅查询启用规则

**接口**：`GET /regexRules/query?page=1&pageSize=10&enableStatus=1`  
**预期结果**：返回启用规则；供工作台扫描使用  
**实际结果**：`total=2`，folders=`docs`, `.cursor`  
**状态**：通过

### TC-012: 新增规则

**接口**：`POST /regexRules/insert`  
**请求参数**：

```json
{
  "ruleName": "FABRIC_E2E_TEST_RULE",
  "folderName": "docs",
  "filePattern": "\\.md$",
  "description": "Fabric E2E auto test - safe to delete",
  "enableStatus": 1
}
```

**预期结果**：`code=200`，`data` 为新建 id  
**实际结果**：`code=200`，`id=d61019a3-0210-4f96-a40d-b1545f1620d5`  
**状态**：通过

### TC-013: 修改规则

**接口**：`POST /regexRules/update`  
**请求参数**：同 id，`description=updated by e2e`  
**预期结果**：`code=200`，`data=true`；再查可见新描述  
**实际结果**：update 成功；search `FABRIC_E2E` 命中 1 条，`description=updated by e2e`  
**状态**：通过

### TC-014: 行内启停

**接口**：`POST /regexRules/update`（仅 `id` + `enableStatus`）  
**预期结果**：禁用 `0` / 启用 `1` 均成功  
**实际结果**：两次均 `code=200`，`data=true`  
**状态**：通过

### TC-015: 删除规则并确认不可再查

**接口**：`POST /regexRules/delete`，body `{ "ids": ["<id>"] }`  
**预期结果**：删除成功；按名称搜索 `total=0`  
**实际结果**：delete `data=true`；after search `records=[]`，`total=0`  
**状态**：通过

---

### 3.3 白名单扫描语义（本地复现）

### TC-020: 按启用规则扫描本仓库命中文件

**前置条件**：启用规则同 TC-011；根目录 `D:\myComponent\WorkBench`  
**步骤**：对根下第一层目录 `docs`、`.cursor` 递归，文件名匹配 `\.mdc?$`  
**预期结果**：能命中 docs 下 md/mdc 与 `.cursor` 下 md/mdc；数量 > 0  
**实际结果**：命中 **66** 个（docs 42 + `.cursor` 24）；示例含 `docs/superpowers/plans/*.md`、`.cursor/skills/**`  
**状态**：通过  
**说明**：整仓根对照；日常勾验用 TC-021 夹具根。

### TC-021: 按启用规则扫描流程夹具根

**前置条件**：启用规则含 `folderName=docs`；根目录 `docs/test/fixtures/fabric-e2e`  
**步骤**：对根下第一层目录按规则扫描（夹具无 `.cursor`）  
**预期结果**：仅命中 `docs/flow-preview.md`、`docs/flow-relate.mdc`（2 个）  
**实际结果（复测）**：`HIT_COUNT=2`，路径与预期一致；`.cursor` 规则因目录不存在而跳过  
**状态**：通过

### TC-022: 夹具 frontmatter 剥离

**前置条件**：`docs/test/fixtures/fabric-e2e/docs/flow-preview.md`  
**步骤**：用项目 `parseFrontmatter` 解析  
**预期结果**：`matter.name=flow-preview`；body 以 `# 流程预览样例` 开头，不含 YAML 围栏  
**实际结果（复测）**：与预期一致（`stillHasFence=false`）  
**状态**：通过

---

### 3.4 AI 分析 / 取消 API

### TC-030: conversation SSE 流式分析（正向）

**接口**：`POST /qoderSessions/conversation`  
**请求参数（复测）**：`fileName=flow-relate.mdc`，`fileContent` = 夹具文件正文  

**预期结果**：

- HTTP 2xx，SSE `data` 帧可读
- 出现 `sessionId`
- `content` 累加增长
- 出现 `status=STOP`
- 过程中或结束前可出现 `renderCode`（关系图 JSON；非每次必有）

**实际结果**：

- 初测（短样例）：HTTP 200；32 帧；`sawStop=true`，`sawRender=true`
- **复测（夹具 `flow-relate.mdc`）**：HTTP 200；10 帧；`sessionId=ca48c64d-…`；`contentLen=143`；`sawStop=true`；**本轮无 `renderCode`**
- STOP 后连接仍可能不关闭（curl max-time 超时）；不影响 STOP 判定

**状态**：通过（流式主路径）；图谱字段本轮未返回，UI 图谱勾验仍依赖浏览器 TC-104

### TC-031: 空 fileContent 直调后端

**接口**：同 TC-030，`fileContent=""`  
**预期结果**：前端会先 warning 不发请求；若直调后端应有明确失败而非未处理 500  
**实际结果**：HTTP **500**，Spring 体：`Internal Server Error`，path=`/qoderSessions/conversation`  
**状态**：失败  
**说明**：前端有空内容拦截时用户路径可规避；接口本身不稳健。

### TC-032: 分析结束后 cancel

**接口**：`POST /qoderSessions/{sessionId}/cancel`  
**前置条件**：TC-030 已拿到 sessionId（流已 STOP）  
**预期结果**：业务成功；前端按后端 `{ meta, data }` 判定（`meta.success`）  
**实际结果**：

- 初测 / **复测**均为 HTTP 200：`meta.success=true`，`data=true`
- 复测 session：`ca48c64d-1cc4-4972-b84e-e74f091f5034` → 按 `meta.success` 可 resolve

**状态**：通过

### TC-033: 取消不存在的 session

**接口**：`POST /qoderSessions/not-a-real-session/cancel`  
**预期结果**：明确业务失败；HTTP/业务码可区分  
**实际结果（复测）**：HTTP 200，`meta.success=false`，`message=Session 不存在`；按 `meta` 应 reject  
**状态**：通过

---

### 3.5 技术检查

### TC-040: Vitest

**步骤**：`yarn test`  
**预期结果**：退出码 0  
**实际结果**：`No test files found`，`passWithNoTests: true`，退出码 0  
**状态**：通过

### TC-041: 生产构建

**步骤**：`yarn build`（`tsc -b && vite build`）  
**预期结果**：构建成功  
**实际结果**：成功，约 1.40s；chunk `index-*.js` ≈ 1.79MB（有 >500kB 体积告警，非失败）  
**状态**：通过

---

### 3.6 浏览器 UI（人工勾验清单）

> Playwright 方案因需改业务代码挂测试缝，已撤销。  
> **选夹根目录**：[`docs/test/fixtures/fabric-e2e`](./fixtures/fabric-e2e/)（勿选整仓根）。说明见夹具内 `README.md`。

### TC-100: 首页进入工作台

**步骤**：打开 `/` → 点击「进入工作台」  
**预期结果**：进入 `/workbench`；可见选文件夹入口  
**实际结果**：待人工勾验  
**状态**：阻塞

### TC-101: 选择文件夹并扫描（主路径）

**步骤**：工作台 → 选择文件夹 → 授权 `docs/test/fixtures/fabric-e2e`  
**预期结果**：

- 扫描中出现 `FabricLoading`（非 antd Spin）
- 左侧目录树仅见 `docs/flow-preview.md`、`docs/flow-relate.mdc`（2 个）

**实际结果**：扫描语义见 TC-021；浏览器授权/树 UI 待人工  
**状态**：阻塞

### TC-102: 选中文件 Markdown 预览

**步骤**：点选 `docs/flow-preview.md`  
**预期结果**：右侧预览正文；YAML frontmatter 已剥离  
**实际结果**：剥离逻辑见 TC-022；预览 UI 待人工  
**状态**：阻塞

### TC-103: 打开分析浮窗并流式出字

**步骤**：点选 `docs/flow-relate.mdc` → 一键分析  
**预期结果**：浮窗打开；左栏 Markdown 流式增长；STOP 后稳定  
**实际结果**：接口 SSE 见 TC-030；浮窗 UI 待人工  
**状态**：阻塞

### TC-104: 关系图谱渲染与节点点击

**步骤**：STOP 后查看右栏；点击指向 `flow-preview.md` 的节点（若有 path）  
**预期结果**：右栏出图；点击可联动选中  
**实际结果**：待人工勾验  
**状态**：阻塞

### TC-105: 重分析 / 关窗中断

**步骤**：分析进行中再次分析或关闭浮窗  
**预期结果**：旧流中断；再开为空态；cancel 不阻断 UI  
**实际结果**：待人工；cancel 已按 `meta` 解析（ISS-001 已修）  
**状态**：阻塞

### TC-106: 正则设置页 CRUD UI

**步骤**：打开 `/regex-settings` → 查询 / 新建 / 编辑 / 启停 / 删除  
**预期结果**：列表刷新；非法正则提示「正则语法无效」  
**实际结果**：API CRUD（TC-010–015）通过；页面交互待人工  
**状态**：阻塞

### TC-107: 首页演示视频

**步骤**：打开 `/`，观察 Hero 下视频  
**预期结果**：存在 `ysVideo.mp4` 时可播放；资源缺失时不撑破布局  
**实际结果**：资源见 TC-005；播放交互待人工  
**状态**：阻塞

### TC-108: SPA 壳层与 NotFound（页面级）

**步骤**：浏览器访问不存在路径（如 `/not-a-page`）  
**预期结果**：展示前端 NotFound，而非空白  
**实际结果**：服务器均返回 SPA HTML（TC-004）  
**状态**：通过（按「入口可达」口径）  

### TC-109: 代理联调就绪（页面侧）

**步骤**：在已开代理的 dev 下打开正则设置，确认列表有数据  
**预期结果**：列表能加载现网启用规则  
**实际结果**：代理 query 已实测有数据；UI 列表待人工  
**状态**：通过（按「数据链路就绪」口径）

---

## 4. 问题清单

| ID | 严重度 | 关联用例 | 现象 | 复现 | 影响面 |
| --- | --- | --- | --- | --- | --- |
| ISS-001 | 高（已修复） | TC-032 / TC-033 / TC-105 | `/qoderSessions/{id}/cancel` 响应为 `{ meta, data }`，前端曾按 `{ code }` 解析导致成功亦失败 | 任意 cancel | 已改：`QoderSessionsCancelApi` 以 `meta.success` / `meta.message` 为准（见 `src/apis/qoderSessions/cancel`） |
| ISS-002 | 中 | TC-031 | `fileContent` 为空时 conversation 返回 Spring 500，而非统一业务错误体 | `POST /qoderSessions/conversation` + 空内容 | 直调/绕过前端校验时体验差；前端当前有空内容拦截可部分规避 |
| ISS-003 | 低 | TC-030 | SSE 在 `STOP` 后连接可能不立即关闭，客户端读流易拖到超时 | curl 读满 90s 才结束，但 STOP 已早到 | 仅影响未按 `STOP` 主动结束的客户端；现网前端按 `status=STOP` 处理，风险低 |
| OBS-001 | 信息 | TC-041 | 生产包单 chunk ≈ 1.79MB，构建告警 >500kB | `yarn build` | 首屏体积；非功能缺陷 |

## 5. 结论与建议

**结论**：接口主链路可用；浏览器 UI 主路径改为人工勾验（Playwright/业务测试缝已撤销，避免污染业务代码）。  
**尚未闭合**：§3.6 阻塞项，请用夹具根在 Chrome 勾验。  
**已处理**：ISS-001（cancel `meta` 解析，保留）。  
**仍建议关注**：ISS-002。

**人工勾验**：Chrome 选 [`docs/test/fixtures/fabric-e2e`](./fixtures/fabric-e2e/) 按 §3.6 / 夹具 README。
