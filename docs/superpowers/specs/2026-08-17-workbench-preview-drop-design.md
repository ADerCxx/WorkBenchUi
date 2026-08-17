# 工作台 — 预览区拖入单文件预览

日期：2026-08-17  
状态：已实现  

## 目标

为工作台右侧预览区增加 **OS 单文件拖入**：拖入后作为当前选中文件，复用现有 Markdown / 原文预览，并允许打开分析面板。未选择项目根时亦可使用。

### 成功标准

1. 将单个白名单文本文件拖入预览区后，顶栏显示文件名，正文按当前模式渲染（默认 Markdown，可切原文）
2. 拖入后「分析」可用；分析内容取自拖入文件文本
3. 未选项目根 / 未扫描时也可拖入预览
4. 拖入过程中预览区出现「释放以预览」遮罩；离开或放下后消失
5. 多文件、文件夹、非白名单扩展名均提示且不改动当前选中与内容
6. 从左侧目录树再选文件后，回到扫描内容（拖入覆盖层清除）
7. 扩展名白名单判定有纯函数 + Vitest 覆盖

## 非目标

- 将拖入文件并入目录树或扫描结果
- 图片 / PDF / 二进制预览
- 暴露完整磁盘路径（浏览器拖入通常仅有 `File.name`）
- 多文件队列或批量预览
- 拖入时重置 Markdown / 原文模式
- 文件大小硬上限（读失败再报错即可）

## 背景

工作台已有：选项目根 → 白名单扫描 → 左树选文件 → `PreviewPane`（Markdown / 原文）。需要在不搅乱扫描树的前提下，支持从系统资源管理器直接拖入单个文本文件进行预览与分析。

## 决策

采用 **外部覆盖层**（方案 1）。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 与目录树关系 | 等同当前选中，不进树 | `selectedPath` + 覆盖层内容；树无该节点 |
| 状态归属 | `Workbench` 持有 `droppedFile` | 预览与分析共用同一内容源 |
| 拖放命中区 | `PreviewPane` 整区 | 含空态；父组件接收解析后的 path/content |
| 文件类型 | 扩展名白名单 | 大小写不敏感；不在名单则 warning |
| 未选项目 | 允许拖入 | 不依赖 `hasPicked` |
| 拖入反馈 | 遮罩叠加 | 虚线框 +「释放以预览」；空态另有副文案 |
| 路径展示 | `file.name` | OS 拖入无可靠绝对路径 |
| 同名冲突 | 覆盖层优先 | 点树则清覆盖层，回到 `contentByPath` |

## 技术方案

### 结构

```
src/pages/Workbench/
  index.tsx                 # droppedFile 状态、内容优先级、onDropFile
  components/PreviewPane/
    index.tsx               # drag/drop、遮罩、空态副文案、回调父组件
    index.less              # 拖入遮罩样式
    types.ts                # 扩展 props（onDropFile 等）
  drop/
    isAllowedPreviewExt.ts  # 扩展名白名单
    readDroppedTextFile.ts  # 单文件校验 + File.text()
    types.ts                # DroppedFile 等
    __tests__/...
```

### 状态与数据流

```
droppedFile: { path: string; content: string } | null

拖入成功 → droppedFile = { path: file.name, content }; selectedPath = file.name
点左侧树 → selectedPath = path; droppedFile = null
重新选项目根 / 扫描 → 清空 selectedPath 与 droppedFile（与现有清空选中一致）

selectedContent =
  droppedFile !== null && selectedPath === droppedFile.path
    ? droppedFile.content
    : (selectedPath !== null ? contentByPath.get(selectedPath) ?? null : null)
```

分析面板继续使用 `selectedPath` 派生的文件名与 `selectedContent`；`analysisDisabled === (selectedPath === null)`。

### 组件职责

| 单元 | 做什么 | 怎么用 | 依赖 |
|------|--------|--------|------|
| `Workbench` | 持有覆盖层、内容优先级、清空时机 | 现有编排 + `onDropFile` | 不感知 DOM 拖放细节 |
| `PreviewPane` | dragover/drop、遮罩、空态文案、把 File 交给校验后回调 | `path` / `content` / `onDropFile` | 调用 drop 纯函数 |
| `isAllowedPreviewExt` | 扩展名是否允许 | `isAllowedPreviewExt(name)` | 无 UI |
| `readDroppedTextFile` | 仅单文件 + 白名单 + 读文本 | 返回 `{ path, content }` 或抛错/返回错误码 | File API |

### `PreviewPane` 交互

| 状态 | UI |
|------|-----|
| 无选中 | Empty 垂直水平居中于预览区：「从左侧选择文件」+ 副文案「或拖入单个文本文件预览」 |
| 拖入中（`dragenter`/`dragover` 且含 Files） | 预览区整区遮罩（铺满 `dropTarget`）：「释放以预览」 |
| `dragleave` / `drop` / 取消 | 去掉遮罩 |
| 已选中（含拖入） | 现有顶栏 + Markdown/原文；模式不因拖入重置 |

拖放时 `preventDefault` / `stopPropagation`，避免浏览器导航打开文件。`dragCounter` 或等价方式处理子元素进出导致的误 leave。

### 扩展名白名单（初版）

`.md` `.mdc` `.markdown` `.txt` `.ts` `.tsx` `.js` `.jsx` `.mjs` `.cjs` `.json` `.css` `.less` `.scss` `.html` `.htm` `.xml` `.yml` `.yaml` `.toml` `.ini` `.env` `.sh` `.bat` `.ps1` `.java` `.py` `.go` `.rs` `.sql` `.svg`

### 错误与边界

| 情况 | 行为 |
|------|------|
| 0 个文件 / 非 Files | 忽略 |
| >1 个文件 | `message.warning`「仅支持拖入单个文件」 |
| 文件夹 | `message.warning`，不预览 |
| 扩展名不在白名单 | `message.warning`「不支持该文件类型」 |
| 读文件失败 | `message.error` |
| 同名再次拖入 | 覆盖 `droppedFile` |

### 测试与验收

- Vitest：`isAllowedPreviewExt`（大小写、无扩展名、白名单内外）；`readDroppedTextFile` 在可 mock 的范围内测「多文件拒绝」逻辑（若 File mock 成本高则至少测白名单与错误分支纯逻辑）
- 手工：未选项目拖入、有内容时遮罩、多文件/非白名单 warning、拖入后分析可开、点树后内容切回扫描文件

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-17 | 初稿：外部覆盖层 + PreviewPane 拖放遮罩 + 扩展名白名单 |
| 2026-08-17 | 实现：PreviewPane 拖放 + droppedFile 覆盖层 |
| 2026-08-17 | UI：遮罩铺满预览区；空态 Empty 居中 |
