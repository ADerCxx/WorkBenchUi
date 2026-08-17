# 工作台预览区拖入单文件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 预览区支持从 OS 拖入单个白名单文本文件，作为当前选中并复用 Markdown/原文预览与分析。

**Architecture:** `Workbench` 持有 `droppedFile` 覆盖层；内容解析优先覆盖层，再回退 `contentByPath`。`PreviewPane` 负责拖放命中区与遮罩，校验/读文件走 `drop/` 纯函数后回调父组件。不并入目录树。

**Tech Stack:** React 19、antd 6（Empty / message）、Less CSS Modules、Vitest（纯函数）

**Spec:** `docs/superpowers/specs/2026-08-17-workbench-preview-drop-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

**Status:** 代码实现已完成（Task 1–5）；文档已同步（Task 6 Step 2）。待人工手工验收（Task 6 Step 1）后关闭。

**Skills（实现时遵守）:** `vitest-pure-fn`、`module-file-layout`、`css-module-less`；收尾按 `sync-design-plan` 将 spec 标为已实现。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `src/pages/Workbench/drop/types.ts` | `DroppedFile`、`DropReadError`、`DropReadResult` |
| `src/pages/Workbench/drop/isAllowedPreviewExt.ts` | 扩展名白名单判定 |
| `src/pages/Workbench/drop/readDroppedTextFile.ts` | 单文件校验 + 读文本 |
| `src/pages/Workbench/drop/resolveSelectedContent.ts` | 覆盖层优先的内容解析 |
| `src/pages/Workbench/drop/__tests__/isAllowedPreviewExt.test.ts` | 白名单单测 |
| `src/pages/Workbench/drop/__tests__/readDroppedTextFile.test.ts` | 读文件结果分支单测 |
| `src/pages/Workbench/drop/__tests__/resolveSelectedContent.test.ts` | 内容优先级单测 |
| `src/pages/Workbench/components/PreviewPane/types.ts` | 扩展 `onDropFile` |
| `src/pages/Workbench/components/PreviewPane/index.tsx` | 拖放 + 遮罩 + 空态副文案 |
| `src/pages/Workbench/components/PreviewPane/index.less` | 遮罩样式 |
| `src/pages/Workbench/index.tsx` | `droppedFile` 状态与接线 |
| `docs/superpowers/specs/2026-08-17-workbench-preview-drop-design.md` | 状态 → 已实现 |

---

### Task 1: `DroppedFile` 类型与扩展名白名单（TDD）

**Files:**
- Create: `src/pages/Workbench/drop/types.ts`
- Create: `src/pages/Workbench/drop/isAllowedPreviewExt.ts`
- Create: `src/pages/Workbench/drop/__tests__/isAllowedPreviewExt.test.ts`

- [ ] **Step 1: 写失败单测**

创建 `src/pages/Workbench/drop/__tests__/isAllowedPreviewExt.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { isAllowedPreviewExt } from '../isAllowedPreviewExt';

describe('isAllowedPreviewExt', () => {
  it('白名单扩展名应通过（含大小写）', () => {
    expect(isAllowedPreviewExt('a.md')).toBe(true);
    expect(isAllowedPreviewExt('Rule.MDC')).toBe(true);
    expect(isAllowedPreviewExt('x.TsX')).toBe(true);
    expect(isAllowedPreviewExt('config.JSON')).toBe(true);
  });

  it('无扩展名或不在白名单应拒绝', () => {
    expect(isAllowedPreviewExt('README')).toBe(false);
    expect(isAllowedPreviewExt('a.png')).toBe(false);
    expect(isAllowedPreviewExt('a.pdf')).toBe(false);
    expect(isAllowedPreviewExt('')).toBe(false);
  });

  it('只取最后一个扩展名', () => {
    expect(isAllowedPreviewExt('archive.tar.gz')).toBe(false);
    expect(isAllowedPreviewExt('foo.bar.md')).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/drop/__tests__/isAllowedPreviewExt.test.ts
```

Expected: FAIL（模块不存在或导出缺失）

- [ ] **Step 3: 写 types + 实现**

创建 `src/pages/Workbench/drop/types.ts`：

```ts
export type DroppedFile = {
  path: string;
  content: string;
};

export type DropReadErrorCode =
  | 'empty'
  | 'multiple'
  | 'directory'
  | 'unsupported'
  | 'read_failed';

export type DropReadOk = { ok: true; file: DroppedFile };
export type DropReadErr = { ok: false; code: DropReadErrorCode };
export type DropReadResult = DropReadOk | DropReadErr;
```

创建 `src/pages/Workbench/drop/isAllowedPreviewExt.ts`：

```ts
const ALLOWED = new Set([
  'md',
  'mdc',
  'markdown',
  'txt',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'json',
  'css',
  'less',
  'scss',
  'html',
  'htm',
  'xml',
  'yml',
  'yaml',
  'toml',
  'ini',
  'env',
  'sh',
  'bat',
  'ps1',
  'java',
  'py',
  'go',
  'rs',
  'sql',
  'svg',
]);

/**
 * 按文件名最后一个扩展名判定是否允许预览（大小写不敏感）
 */
export function isAllowedPreviewExt(fileName: string): boolean {
  const base = fileName.trim();
  if (!base) return false;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return false;
  const ext = base.slice(dot + 1).toLowerCase();
  return ALLOWED.has(ext);
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/drop/__tests__/isAllowedPreviewExt.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit（跳过，除非用户要求）**

---

### Task 2: `resolveSelectedContent`（TDD）

**Files:**
- Create: `src/pages/Workbench/drop/resolveSelectedContent.ts`
- Create: `src/pages/Workbench/drop/__tests__/resolveSelectedContent.test.ts`

- [ ] **Step 1: 写失败单测**

```ts
import { describe, expect, it } from 'vitest';
import { resolveSelectedContent } from '../resolveSelectedContent';
import type { DroppedFile } from '../types';

describe('resolveSelectedContent', () => {
  const scanned = new Map<string, string>([['docs/a.md', 'from-scan']]);

  it('无选中返回 null', () => {
    expect(
      resolveSelectedContent(null, null, scanned),
    ).toBeNull();
  });

  it('覆盖层 path 匹配时优先覆盖层', () => {
    const dropped: DroppedFile = { path: 'a.md', content: 'dropped' };
    expect(resolveSelectedContent('a.md', dropped, scanned)).toBe('dropped');
  });

  it('覆盖层 path 不匹配时回退扫描 Map', () => {
    const dropped: DroppedFile = { path: 'a.md', content: 'dropped' };
    expect(resolveSelectedContent('docs/a.md', dropped, scanned)).toBe(
      'from-scan',
    );
  });

  it('无覆盖层时从 Map 取值，缺失为 null', () => {
    expect(resolveSelectedContent('docs/a.md', null, scanned)).toBe('from-scan');
    expect(resolveSelectedContent('missing.md', null, scanned)).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
yarn test src/pages/Workbench/drop/__tests__/resolveSelectedContent.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现**

```ts
import type { DroppedFile } from './types';

/**
 * 当前预览/分析用文本：覆盖层优先，否则扫描 Map
 */
export function resolveSelectedContent(
  selectedPath: string | null,
  droppedFile: DroppedFile | null,
  contentByPath: Map<string, string>,
): string | null {
  if (selectedPath === null) return null;
  if (droppedFile !== null && selectedPath === droppedFile.path) {
    return droppedFile.content;
  }
  return contentByPath.get(selectedPath) ?? null;
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/drop/__tests__/resolveSelectedContent.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit（跳过）**

---

### Task 3: `readDroppedTextFile`（TDD）

**Files:**
- Create: `src/pages/Workbench/drop/readDroppedTextFile.ts`
- Create: `src/pages/Workbench/drop/__tests__/readDroppedTextFile.test.ts`

- [ ] **Step 1: 写失败单测**

用轻量 mock：`{ name, text }` 满足 `Pick<File, 'name'> & { text: () => Promise<string> }`，函数签名接受该形状，避免 jsdom。

```ts
import { describe, expect, it } from 'vitest';
import { readDroppedTextFile } from '../readDroppedTextFile';

type FakeFile = { name: string; text: () => Promise<string> };

function file(name: string, content = 'hello'): FakeFile {
  return { name, text: async () => content };
}

describe('readDroppedTextFile', () => {
  it('空列表 → empty', async () => {
    await expect(readDroppedTextFile([])).resolves.toEqual({
      ok: false,
      code: 'empty',
    });
  });

  it('多个文件 → multiple', async () => {
    await expect(
      readDroppedTextFile([file('a.md'), file('b.md')]),
    ).resolves.toEqual({ ok: false, code: 'multiple' });
  });

  it('目录标记 → directory', async () => {
    await expect(
      readDroppedTextFile([file('folder')], { isDirectory: true }),
    ).resolves.toEqual({ ok: false, code: 'directory' });
  });

  it('非白名单 → unsupported', async () => {
    await expect(readDroppedTextFile([file('a.png')])).resolves.toEqual({
      ok: false,
      code: 'unsupported',
    });
  });

  it('读失败 → read_failed', async () => {
    const bad: FakeFile = {
      name: 'a.md',
      text: async () => {
        throw new Error('boom');
      },
    };
    await expect(readDroppedTextFile([bad])).resolves.toEqual({
      ok: false,
      code: 'read_failed',
    });
  });

  it('成功返回 path+content', async () => {
    await expect(readDroppedTextFile([file('Skill.md', '# hi')])).resolves.toEqual({
      ok: true,
      file: { path: 'Skill.md', content: '# hi' },
    });
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
yarn test src/pages/Workbench/drop/__tests__/readDroppedTextFile.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现**

```ts
import { isAllowedPreviewExt } from './isAllowedPreviewExt';
import type { DropReadResult } from './types';

/** 可测的最小 File 面 */
export type ReadableDropFile = {
  name: string;
  text: () => Promise<string>;
};

export type ReadDroppedOptions = {
  /** 调用方用 webkitGetAsEntry().isDirectory 探测后传入 */
  isDirectory?: boolean;
};

/**
 * 从拖入的 File 列表解析单个白名单文本文件
 */
export async function readDroppedTextFile(
  files: readonly ReadableDropFile[],
  options: ReadDroppedOptions = {},
): Promise<DropReadResult> {
  if (options.isDirectory) {
    return { ok: false, code: 'directory' };
  }
  if (files.length === 0) {
    return { ok: false, code: 'empty' };
  }
  if (files.length > 1) {
    return { ok: false, code: 'multiple' };
  }
  const f = files[0];
  if (!isAllowedPreviewExt(f.name)) {
    return { ok: false, code: 'unsupported' };
  }
  try {
    const content = await f.text();
    return { ok: true, file: { path: f.name, content } };
  } catch {
    return { ok: false, code: 'read_failed' };
  }
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/drop/__tests__/readDroppedTextFile.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit（跳过）**

---

### Task 4: `PreviewPane` 拖放 UI

**Files:**
- Modify: `src/pages/Workbench/components/PreviewPane/types.ts`
- Modify: `src/pages/Workbench/components/PreviewPane/index.less`
- Modify: `src/pages/Workbench/components/PreviewPane/index.tsx`

- [ ] **Step 1: 扩展 types**

将 `types.ts` 改为：

```ts
import type { DroppedFile } from '../../drop/types';

export type PreviewMode = 'markdown' | 'raw';

export type PreviewPaneProps = {
  path: string | null;
  content: string | null;
  /** 拖入校验通过后的文件；由父组件写入覆盖层 */
  onDropFile: (file: DroppedFile) => void;
};
```

- [ ] **Step 2: 样式 — 在 `index.less` 追加**

```less
/* Workbench index.less：.preview 需 display:flex; flex-direction:column; min-height:0 */
.empty {
  margin: auto; /* 替代 margin-top:80px，在 flex 的 dropTarget 内居中 */
}

.dropTarget {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dropOverlay {
  position: absolute;
  inset: 0; /* 铺满整区，勿用 inset:8px */
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  border: 2px dashed var(--accent, #1677ff);
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent, #1677ff) 8%, transparent);
  color: var(--accent, #1677ff);
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 600;
}

.emptyHint {
  margin-top: 8px;
  color: var(--muted, #8c8c8c);
  font-size: 12px;
}
```

若项目无 `--accent` / `--muted`，保留 `#1677ff` / `#8c8c8c` 回退即可。

- [ ] **Step 3: 重写 `PreviewPane` 拖放逻辑**

要点（完整实现写入 `index.tsx`）：

1. Props 增加 `onDropFile`
2. `dragging` state + `dragDepthRef`（enter +1 / leave -1，depth===0 才关遮罩）
3. `onDragEnter` / `onDragOver`：若 `dataTransfer.types` 含 `Files`，`preventDefault`，设 `dropEffect = 'copy'`，并进入 dragging
4. `onDrop`：`preventDefault`；关遮罩；从 `dataTransfer.files` 取列表；用 `items[0].webkitGetAsEntry?.()?.isDirectory` 得 `isDirectory`；调用 `readDroppedTextFile`；按 `code` 用 `message.warning` / `message.error`；`ok` 则 `onDropFile(result.file)`
5. 空态：外层同样包 `dropTarget`；Empty description 用片段：主文案 + `<div className={styles.emptyHint}>或拖入单个文本文件预览</div>`
6. 有内容时：root 外包 `dropTarget`，dragging 时渲染 overlay「释放以预览」

文案映射：

| code | message |
|------|---------|
| `multiple` | warning「仅支持拖入单个文件」 |
| `directory` | warning「不支持拖入文件夹」 |
| `unsupported` | warning「不支持该文件类型」 |
| `read_failed` | error「读取文件失败」 |
| `empty` | 忽略（不 toast） |

示意骨架（实现时补全 import 与两端 UI）：

```tsx
import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { readDroppedTextFile } from '../../drop/readDroppedTextFile';
// ... existing imports

function PreviewPane({ path, content, onDropFile }: PreviewPaneProps) {
  const [mode, setMode] = useState<PreviewMode>('markdown');
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setDragging(false);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (![...e.dataTransfer.types].includes('Files')) return;
    dragDepthRef.current += 1;
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ([...e.dataTransfer.types].includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resetDrag();
      const list = Array.from(e.dataTransfer.files);
      const entry = e.dataTransfer.items?.[0]?.webkitGetAsEntry?.() ?? null;
      const isDirectory = entry?.isDirectory === true;
      const result = await readDroppedTextFile(list, { isDirectory });
      if (!result.ok) {
        if (result.code === 'empty') return;
        if (result.code === 'multiple') {
          message.warning('仅支持拖入单个文件');
          return;
        }
        if (result.code === 'directory') {
          message.warning('不支持拖入文件夹');
          return;
        }
        if (result.code === 'unsupported') {
          message.warning('不支持该文件类型');
          return;
        }
        message.error('读取文件失败');
        return;
      }
      onDropFile(result.file);
    },
    [onDropFile, resetDrag],
  );

  const dropHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  // 空态与有内容态均用 <div className={styles.dropTarget} {...dropHandlers}>
  // dragging && <div className={styles.dropOverlay}>释放以预览</div>
  // ...保留原 Markdown / 原文渲染
}
```

若 `webkitGetAsEntry` 类型报错：在 drop 模块旁已有 `file-system-access.d.ts` 可参考，或对 `items[0]` 做可选链 + `as { isDirectory?: boolean } | null`。

- [ ] **Step 4: Commit（跳过）**

---

### Task 5: `Workbench` 接线

**Files:**
- Modify: `src/pages/Workbench/index.tsx`

- [ ] **Step 1: 引入状态与解析**

在现有 imports 旁增加：

```ts
import type { DroppedFile } from './drop/types';
import { resolveSelectedContent } from './drop/resolveSelectedContent';
```

在组件内增加：

```ts
const [droppedFile, setDroppedFile] = useState<DroppedFile | null>(null);
```

将 `selectedContent` 替换为：

```ts
const selectedContent = resolveSelectedContent(
  selectedPath,
  droppedFile,
  contentByPath,
);
```

- [ ] **Step 2: 清空覆盖层的时机**

`handlePickFolder` 成功路径里（与 `setSelectedPath(null)` 同处）增加 `setDroppedFile(null)`；无规则提前 return 的分支同样清掉。

`handleSelectFile`：

```ts
const handleSelectFile = useCallback((path: string) => {
  setDroppedFile(null);
  setSelectedPath(path);
}, []);
```

- [ ] **Step 3: 拖入成功回调**

```ts
const handleDropFile = useCallback((file: DroppedFile) => {
  setDroppedFile(file);
  setSelectedPath(file.path);
}, []);
```

挂载：

```tsx
<PreviewPane
  path={selectedPath}
  content={selectedContent}
  onDropFile={handleDropFile}
/>
```

- [ ] **Step 4: 类型检查**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/drop
npx tsc -b --pretty false
```

Expected: drop 相关测试 PASS；`tsc` 无因本次改动新增的错误。

- [ ] **Step 5: Commit（跳过）**

---

### Task 6: 手工验收 + 文档同步

**Files:**
- Modify: `docs/superpowers/specs/2026-08-17-workbench-preview-drop-design.md`
- Modify: 本计划勾选状态（由执行者更新）

- [ ] **Step 1: 手工验收清单**

```powershell
yarn dev
```

| # | 操作 | 期望 |
|---|------|------|
| 1 | 未选项目，拖入 `.md` | 顶栏文件名 + 可预览；分析可点 |
| 2 | 拖入过程悬停预览区 | 「释放以预览」遮罩；离开消失 |
| 3 | 拖入 2 个文件 | warning；选中不变 |
| 4 | 拖入 `.png` | warning「不支持该文件类型」 |
| 5 | 有扫描文件时拖入覆盖，再点左侧树 | 回到扫描内容 |
| 6 | 拖入后切「原文」再拖另一文件 | 模式保持；内容更新 |

- [x] **Step 2: 同步 design**

将 spec 文首状态改为 `已实现`，修订记录追加一行：

```md
| 2026-08-17 | 实现：PreviewPane 拖放 + droppedFile 覆盖层 |
```

本计划无需另写第二份 design；若实现与 spec 有偏差，按 `sync-design-plan` 回写决策表。

- [ ] **Step 3: Commit（跳过）**

---

## 已知实现注意点

1. **空态也要可 drop**：Empty 外包一层 `dropTarget`，不要只在有内容的 `root` 上绑事件。
2. **`dragleave` 抖动**：必须用 depth counter，否则移入子节点会误关遮罩。
3. **文件夹**：Chrome 拖文件夹时 `files` 可能非空；优先信 `webkitGetAsEntry().isDirectory`。
4. **分析 `knownPaths`**：拖入文件不在扫描列表属预期；图跳转匹配不到外部文件即可。
5. **CSS Modules**：`emptyHint` 若放在 Empty `description` 的 React 节点里，类名挂在自有 `div` 上即可。
6. **命中区高度**：`.preview` 与 `.dropTarget` 须 flex 撑满；遮罩 `inset: 0`；空态 Empty 用 `margin: auto` 居中，勿用固定 `margin-top`。

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| 单文件拖入预览 | 3–5 |
| 等同选中可分析 | 5 |
| 未选项目可拖 | 4 空态 drop + 5 |
| 遮罩「释放以预览」 | 4 |
| 多文件/非白名单 warning | 3–4 |
| 点树清覆盖层 | 5 |
| 扩展名 Vitest | 1 |
| 不进目录树 | 全程无改 Catalog |
| 模式不重置 | 4 不改 mode 逻辑 |

无占位符；类型名 `DroppedFile` / `DropReadResult` / `readDroppedTextFile` / `resolveSelectedContent` 前后一致。
