# 工作台 Markdown 文档预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 工作台右侧支持 Markdown / 原文双模式预览（默认 Markdown），并沉淀可复用的 `MarkdownPreview`（GFM + 黑底轻量高亮）。

**Architecture:** `MarkdownPreview` 为全局可复用内核（`react-markdown` + `remark-gfm` + `rehype-highlight` + 项目 Less）；`PreviewPane` 为工作台壳（顶栏 path + Segmented + 空态）；`Workbench` 改挂 `PreviewPane` 并删除 `RawPreview`。模式状态仅存在于 `PreviewPane`。

**Tech Stack:** React 19、antd 6（Empty / Typography / Segmented）、`react-markdown`、`remark-gfm`、`rehype-highlight`、`highlight.js`（样式）、Less CSS Modules

**Spec:** `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。本轮以手工验收为主，不强制组件单测。

**Skills（实现时遵守）:** `module-file-layout`、`css-module-less`、`typography`；收尾若改了页面组件，按 `sync-design-plan` 将 spec 标为已实现即可（本计划已含该步）。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加 `react-markdown`、`remark-gfm`、`rehype-highlight`、`highlight.js` |
| `src/components/MarkdownPreview/types.ts` | `MarkdownPreviewProps` |
| `src/components/MarkdownPreview/index.tsx` | MD → 文档 DOM |
| `src/components/MarkdownPreview/index.less` | 文档排版 + 黑底代码块 |
| `src/pages/Workbench/components/PreviewPane/types.ts` | `PreviewPaneProps`、`PreviewMode` |
| `src/pages/Workbench/components/PreviewPane/index.tsx` | 顶栏 + 模式切换 + 原文/MD |
| `src/pages/Workbench/components/PreviewPane/index.less` | 壳布局（迁自 RawPreview） |
| `src/pages/Workbench/index.tsx` | `RawPreview` → `PreviewPane` |
| `src/pages/Workbench/components/RawPreview/**` | **删除** |
| `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md` | 状态改为已实现 |

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`（由包管理器写入）

- [ ] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
yarn add react-markdown remark-gfm rehype-highlight highlight.js
```

Expected: `dependencies` 出现上述四包，安装无报错。

- [ ] **Step 2: 确认可解析**

```powershell
yarn why react-markdown
yarn why rehype-highlight
```

Expected: 显示已安装版本信息。

---

### Task 2: `MarkdownPreview` 内核

**Files:**
- Create: `src/components/MarkdownPreview/types.ts`
- Create: `src/components/MarkdownPreview/index.less`
- Create: `src/components/MarkdownPreview/index.tsx`

- [ ] **Step 1: 写 types**

创建 `src/components/MarkdownPreview/types.ts`：

```ts
export type MarkdownPreviewProps = {
  source: string;
  className?: string;
};
```

- [ ] **Step 2: 写样式**

创建 `src/components/MarkdownPreview/index.less`：

```less
@md-code-bg: #0d0d0d;

.root {
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;

  :global {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-family: var(--heading);
      font-weight: 700;
      color: var(--text-h);
      margin: 1.25em 0 0.5em;
      line-height: 1.35;
    }

    h1 {
      font-size: 1.75em;
    }

    h2 {
      font-size: 1.4em;
    }

    h3 {
      font-size: 1.2em;
    }

    p {
      margin: 0.75em 0;
    }

    a {
      color: var(--accent);
    }

    ul,
    ol {
      margin: 0.75em 0;
      padding-left: 1.5em;
    }

    blockquote {
      margin: 0.75em 0;
      padding: 0.25em 0 0.25em 0.875em;
      border-left: 3px solid var(--border);
      color: var(--text);
    }

    hr {
      margin: 1.25em 0;
      border: none;
      border-top: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75em 0;
      font-size: 13px;
    }

    th,
    td {
      border: 1px solid var(--border);
      padding: 6px 10px;
      text-align: left;
    }

    th {
      font-weight: 600;
      background: color-mix(in srgb, var(--border) 35%, transparent);
    }

    /* 行内 code：浅底 #f0f4f8 */
    :not(pre) > code {
      font-family: var(--mono);
      font-size: 0.9em;
      padding: 0.15em 0.4em;
      border-radius: 4px;
      background: #f0f4f8;
      color: var(--text-h);
    }

    .task-list-item input[type='checkbox'] {
      appearance: none;
      -webkit-appearance: none;
      width: 1em;
      height: 1em;
      margin: 0 0.4em 0 0;
      vertical-align: -0.125em;
      border: 1.5px solid #c0c4cc;
      border-radius: 3px;
      background: #fff;
      cursor: default;
    }

    .task-list-item input[type='checkbox']:checked {
      border-color: #22c55e;
      background-color: #22c55e;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round' d='M3.5 8.5l3 3 6-7'/%3E%3C/svg%3E");
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
    }

    pre {
      margin: 0.75em 0;
      padding: 12px 14px;
      overflow: auto;
      border-radius: 6px;
      background: @md-code-bg;
    }

    pre code,
    pre code.hljs {
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.5;
      background: transparent;
      color: #e6e6e6;
      padding: 0;
    }
  }
}
```

- [ ] **Step 3: 写组件**

创建 `src/components/MarkdownPreview/index.tsx`：

```tsx
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';
import styles from './index.less';
import type { MarkdownPreviewProps } from './types';

export type { MarkdownPreviewProps } from './types';

/**
 * 可复用 Markdown 文档预览（GFM + 轻量语法高亮）
 */
function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
```

不要新增 `clsx` 依赖。

- [ ] **Step 4: 类型检查**

```powershell
cd D:\myComponent\WorkBench
yarn exec tsc -b --pretty false
```

Expected: 与 `MarkdownPreview` 相关无报错。若 `rehype-highlight` 默认导出类型告警，改为：

```ts
import rehypeHighlight from 'rehype-highlight';
// 若仍报错：
// import rehypeHighlight from 'rehype-highlight/lib/index.js';
```

或 `// @ts-expect-error` 仅在确认是类型包装问题时使用，优先查官方导出。

---

### Task 3: `PreviewPane` 壳

**Files:**
- Create: `src/pages/Workbench/components/PreviewPane/types.ts`
- Create: `src/pages/Workbench/components/PreviewPane/index.less`
- Create: `src/pages/Workbench/components/PreviewPane/index.tsx`

- [ ] **Step 1: 写 types**

创建 `src/pages/Workbench/components/PreviewPane/types.ts`：

```ts
export type PreviewMode = 'markdown' | 'raw';

export type PreviewPaneProps = {
  path: string | null;
  content: string | null;
};
```

- [ ] **Step 2: 写样式**

创建 `src/pages/Workbench/components/PreviewPane/index.less`（由 RawPreview 迁并扩展）：

```less
.empty {
  margin-top: 80px;
}

.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.path {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  font-family: var(--mono);
}

.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.raw {
  margin: 0;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
```

- [ ] **Step 3: 写组件**

创建 `src/pages/Workbench/components/PreviewPane/index.tsx`：

```tsx
import MarkdownPreview from '@/components/MarkdownPreview';
import { Empty, Segmented, Typography } from 'antd';
import { useState } from 'react';
import styles from './index.less';
import type { PreviewMode, PreviewPaneProps } from './types';

export type { PreviewMode, PreviewPaneProps } from './types';

/**
 * 工作台右侧预览壳：顶栏 path + 模式切换；Markdown / 原文
 */
function PreviewPane({ path, content }: PreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('markdown');

  if (!path || content === null) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="从左侧选择文件"
      />
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <Typography.Text code className={styles.path}>
          {path}
        </Typography.Text>
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as PreviewMode)}
          options={[
            { label: 'Markdown', value: 'markdown' },
            { label: '原文', value: 'raw' },
          ]}
        />
      </div>
      <div className={styles.body}>
        {mode === 'markdown' ? (
          <MarkdownPreview source={content} />
        ) : (
          <pre className={styles.raw}>{content}</pre>
        )}
      </div>
    </div>
  );
}

export default PreviewPane;
```

- [ ] **Step 4: 确认 `@/` 别名可解析到 `src/components`**

打开 `tsconfig.app.json` / `vite.config.ts`，确认已有 `@/*` → `src/*`。若已有（项目既有），无需改配置。

---

### Task 4: 接入 Workbench 并删除 `RawPreview`

**Files:**
- Modify: `src/pages/Workbench/index.tsx`
- Delete: `src/pages/Workbench/components/RawPreview/index.tsx`
- Delete: `src/pages/Workbench/components/RawPreview/index.less`
- Delete: `src/pages/Workbench/components/RawPreview/types.ts`

- [x] **Step 1: 替换挂载**

在 `src/pages/Workbench/index.tsx`：

将：

```tsx
import RawPreview from './components/RawPreview';
```

改为：

```tsx
import PreviewPane from './components/PreviewPane';
```

将：

```tsx
<RawPreview path={selectedPath} content={selectedContent} />
```

改为：

```tsx
<PreviewPane path={selectedPath} content={selectedContent} />
```

- [x] **Step 2: 删除 RawPreview 目录下全部文件**

删除：

- `src/pages/Workbench/components/RawPreview/index.tsx`
- `src/pages/Workbench/components/RawPreview/index.less`
- `src/pages/Workbench/components/RawPreview/types.ts`

- [x] **Step 3: 全库确认无残留引用**

```powershell
cd D:\myComponent\WorkBench
rg "RawPreview" src docs
```

Expected: 无业务代码引用（spec/plan 历史文档可仍出现旧名，可忽略）。

- [x] **Step 4: 类型检查 + lint**

```powershell
yarn exec tsc -b --pretty false
yarn lint
```

Expected: 通过（或仅有与本改动无关的既有告警）。

---

### Task 5: 手工验收 + 更新 spec 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md`

- [x] **Step 1: 启动并打开工作台**

以 `tsc -b` + `yarn build` 冒烟代替（通过）。浏览器 File System Access 选目录需人工确认，未在本 Task 交互执行。

```powershell
cd D:\myComponent\WorkBench
yarn dev
```

浏览器打开 `/workbench`，选择含 `.md` / `.mdc` 的项目根，点选一个 Skill/Rule 文件。

- [x] **Step 2: 按清单验收**

代码核验已完成（见下表「核验」列）；视觉/浏览器交互项仍建议人工点选确认。

| # | 检查项 | 期望 | 核验 |
|---|--------|------|------|
| 1 | 未选文件 | Empty「从左侧选择文件」，无 Segmented | code-verified |
| 2 | 选中后默认模式 | Markdown 文档排版（标题/列表可读） | code-verified（默认 `markdown`）；排版观感需浏览器 |
| 3 | 顶栏 | 左 path、右 Segmented（Markdown / 原文） | code-verified |
| 4 | 切到原文 | `<pre>` 原文，与改前观感接近 | code-verified |
| 5 | 再切回 Markdown | 恢复文档预览 | code-verified |
| 6 | 换另一个文件 | 模式保持用户当前选择（不强制回 Markdown） | code-verified（`mode` 不随 path 重置） |
| 7 | 围栏代码块 | 黑底 + 等宽；有语言标记时有高亮 | code-verified（样式/插件）；高亮观感需浏览器 |
| 8 | 行内 code | `#f0f4f8` 浅底 | code-verified（样式）；观感需浏览器 |
| 9 | GFM 表格 | 有边框的表格 | code-verified（`remark-gfm` + table Less）；观感需浏览器 |
| 10 | frontmatter | `---` 块仍出现在渲染结果中（本轮不剥） | code-verified（无剥离逻辑） |
| 11 | `content === ''` | 有顶栏，正文为空 | code-verified（仅 `content === null` 走 Empty） |

- [x] **Step 3: 更新 spec 状态**

将 `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md` 顶部：

```markdown
状态：设计中
```

改为：

```markdown
状态：已实现
```

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| 顶栏 path + 模式切换 | Task 3 |
| 默认 Markdown，可切原文 | Task 3 |
| 文档预览排版 | Task 2 |
| 围栏代码黑底 + 轻量高亮；行内浅底 | Task 2 |
| `MarkdownPreview` 可复用 `source` | Task 2（放 `src/components`） |
| frontmatter 原样 | Task 2/3（不剥） |
| 不接流式 / 不改扫描树等 | 全计划未触碰 |
| 删除 RawPreview 单入口 | Task 4 |
| 换文件保持模式 | Task 3（`useState` 不随 path 重置） |

---

## 执行提示

实现时优先 `subagent-driven-development`：每 Task 一个子代理，Task 之间人工过一眼 UI/类型。

## 修订记录

- 2026-08-06：任务列表勾选改 `appearance: none` 自绘绿色（`accent-color` 对 disabled 无效）。
- 2026-08-06：行内 code 定稿 `#f0f4f8`；任务列表 checkbox `accent-color: #22c55e`。
- 2026-08-06：行内 code Less 改为 `var(--code-bg)` + `var(--text-h)`；围栏块仍用 `@md-code-bg` 黑底。
