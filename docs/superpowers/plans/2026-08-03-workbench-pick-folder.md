# 工作台选择文件夹 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/workbench` 实现选项目根 → 硬编码扫描 `.cursor`/`docs`/`openSpecs` 中 `.md`/`.mdc` → 左侧目录树 → 右侧路径+原文纯文本。

**Architecture:** `/workbench` 改挂 `BlankLayout`；`pages/Workbench` 页内自持顶栏+左树+右预览。扫描与建树为纯模块（可单测）；选目录走 File System Access API，对照 ForgeKit walk 写法但不搬关系图/解析。

**Tech Stack:** React 19、antd 6（Button/Tree/Empty/Spin/message）、Less CSS Modules、Vite、Vitest（为本切片新增，仅测纯函数）

**Spec:** `docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` / `vitest.config.ts` | 增加 `test` 脚本与 Vitest |
| `src/pages/Workbench/scan/types.ts` | `RawFile`、`WorkbenchTreeNode` |
| `src/pages/Workbench/scan/constants.ts` | 约定根、跳过目录、扩展名常量 |
| `src/pages/Workbench/scan/pathMatch.ts` | 约定根/跳过/扩展名判定 |
| `src/pages/Workbench/scan/pathMatch.test.ts` | pathMatch 单测 |
| `src/pages/Workbench/scan/buildTree.ts` | `RawFile[]` → 树 + content Map |
| `src/pages/Workbench/scan/buildTree.test.ts` | buildTree 单测 |
| `src/pages/Workbench/scan/pickProjectRoot.ts` | `showDirectoryPicker` 封装 |
| `src/pages/Workbench/scan/scanHardcodedRoots.ts` | 项目根 walk + 读文件 |
| `src/pages/Workbench/scan/file-system-access.d.ts` | `Window.showDirectoryPicker` 类型补充 |
| `src/pages/Workbench/components/WorkbenchHeader/` | 顶栏（`index.tsx` + `index.less` + `types.ts`） |
| `src/pages/Workbench/components/CatalogTree/` | 左侧树/空态（含 `index.less`） |
| `src/pages/Workbench/components/RawPreview/` | 右侧原文（含 `index.less`） |
| `src/pages/Workbench/index.tsx` | 状态编排 |
| `src/pages/Workbench/index.less` | 三栏布局 |
| `src/router/index.tsx` | `/workbench` → `BlankLayout` |
| `src/layouts/WorkbenchLayout/**` | **不删、本轮路由不用** |
| `docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md` | 状态改为已实现（收尾） |

---

### Task 1: 接入 Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [x] **Step 1: 安装 Vitest**

```powershell
cd D:\myComponent\WorkBench
yarn add -D vitest
```

Expected: `package.json` `devDependencies` 出现 `vitest`，安装无报错。

- [x] **Step 2: 增加配置与脚本**

创建 `vitest.config.ts`：

```ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

在 `package.json` 的 `scripts` 中增加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [x] **Step 3: 确认测试命令可跑（尚无用例时 0 tests 或 empty）**

```powershell
cd D:\myComponent\WorkBench
yarn test
```

Expected: 进程退出码 0，或提示无测试文件但不失败。若 Vitest 因「无文件」失败，先进入 Task 2 写第一个测试后再跑。

- [x] **Step 4: Commit（默认跳过）**

```bash
git add package.json yarn.lock vitest.config.ts
git commit -m "chore: add vitest for workbench unit tests"
```

---

### Task 2: 扫描常量与路径判定（TDD）

**Files:**
- Create: `src/pages/Workbench/scan/types.ts`
- Create: `src/pages/Workbench/scan/constants.ts`
- Create: `src/pages/Workbench/scan/pathMatch.ts`
- Test: `src/pages/Workbench/scan/pathMatch.test.ts`

- [x] **Step 1: 写失败测试**

创建 `src/pages/Workbench/scan/pathMatch.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import {
  isConventionRootName,
  isTargetMarkdown,
  shouldSkipDirName,
} from './pathMatch';

describe('isConventionRootName', () => {
  it('matches hardcoded roots case-insensitively', () => {
    expect(isConventionRootName('.cursor')).toBe(true);
    expect(isConventionRootName('Docs')).toBe(true);
    expect(isConventionRootName('openSpecs')).toBe(true);
    expect(isConventionRootName('OPENSPECS')).toBe(true);
    expect(isConventionRootName('src')).toBe(false);
  });
});

describe('shouldSkipDirName', () => {
  it('skips node_modules and .git', () => {
    expect(shouldSkipDirName('node_modules')).toBe(true);
    expect(shouldSkipDirName('.git')).toBe(true);
    expect(shouldSkipDirName('skills')).toBe(false);
  });
});

describe('isTargetMarkdown', () => {
  it('accepts .md and .mdc only', () => {
    expect(isTargetMarkdown('SKILL.md')).toBe(true);
    expect(isTargetMarkdown('foo.MDC')).toBe(true);
    expect(isTargetMarkdown('a.ts')).toBe(false);
    expect(isTargetMarkdown('readme')).toBe(false);
  });
});
```

- [x] **Step 2: 跑测试确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/scan/pathMatch.test.ts
```

Expected: FAIL（模块不存在或导不出符号）。

- [x] **Step 3: 最小实现**

创建 `src/pages/Workbench/scan/types.ts`：

```ts
export type RawFile = {
  relativePath: string;
  content: string;
};

export type WorkbenchTreeNode = {
  key: string;
  title: string;
  isLeaf?: boolean;
  children?: WorkbenchTreeNode[];
};
```

创建 `src/pages/Workbench/scan/constants.ts`：

```ts
/** 项目根下第一层约定目录（匹配忽略大小写） */
export const CONVENTION_ROOTS: readonly string[] = [
  '.cursor',
  'docs',
  'openSpecs',
];

export const SKIP_DIR_NAMES: readonly string[] = ['node_modules', '.git'];

export const TARGET_EXTENSIONS: readonly string[] = ['.md', '.mdc'];
```

创建 `src/pages/Workbench/scan/pathMatch.ts`：

```ts
import {
  CONVENTION_ROOTS,
  SKIP_DIR_NAMES,
  TARGET_EXTENSIONS,
} from './constants';

const ROOT_SET = new Set(CONVENTION_ROOTS.map((n) => n.toLowerCase()));

export function isConventionRootName(name: string): boolean {
  return ROOT_SET.has(name.toLowerCase());
}

export function shouldSkipDirName(name: string): boolean {
  const lower = name.toLowerCase();
  return SKIP_DIR_NAMES.some((s) => s.toLowerCase() === lower);
}

export function isTargetMarkdown(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return TARGET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
```

- [x] **Step 4: 跑测试确认通过**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/scan/pathMatch.test.ts
```

Expected: PASS（全部用例绿）。

- [x] **Step 5: Commit（默认跳过）**

```bash
git add src/pages/Workbench/scan/
git commit -m "feat: add workbench scan path match helpers"
```

---

### Task 3: buildTree（TDD）

**Files:**
- Create: `src/pages/Workbench/scan/buildTree.ts`
- Test: `src/pages/Workbench/scan/buildTree.test.ts`

- [x] **Step 1: 写失败测试**

创建 `src/pages/Workbench/scan/buildTree.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { buildTree } from './buildTree';
import type { RawFile } from './types';

describe('buildTree', () => {
  it('builds nested tree and content map from relative paths', () => {
    const files: RawFile[] = [
      { relativePath: '.cursor/skills/foo/SKILL.md', content: 'a' },
      { relativePath: '.cursor/rules/bar.mdc', content: 'b' },
      { relativePath: 'docs/readme.md', content: 'c' },
    ];

    const { treeData, contentByPath } = buildTree(files);

    expect(contentByPath.get('.cursor/skills/foo/SKILL.md')).toBe('a');
    expect(contentByPath.get('docs/readme.md')).toBe('c');
    expect(treeData.map((n) => n.key).sort()).toEqual(['.cursor', 'docs']);

    const cursor = treeData.find((n) => n.key === '.cursor')!;
    expect(cursor.isLeaf).toBeFalsy();
    const skills = cursor.children!.find((n) => n.key === '.cursor/skills')!;
    const foo = skills.children!.find((n) => n.key === '.cursor/skills/foo')!;
    const skillFile = foo.children!.find(
      (n) => n.key === '.cursor/skills/foo/SKILL.md',
    )!;
    expect(skillFile.isLeaf).toBe(true);
    expect(skillFile.title).toBe('SKILL.md');
  });

  it('returns empty tree for empty input', () => {
    const { treeData, contentByPath } = buildTree([]);
    expect(treeData).toEqual([]);
    expect(contentByPath.size).toBe(0);
  });
});
```

- [x] **Step 2: 跑测试确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/scan/buildTree.test.ts
```

Expected: FAIL（`buildTree` 未定义）。

- [x] **Step 3: 最小实现**

创建 `src/pages/Workbench/scan/buildTree.ts`：

```ts
import type { RawFile, WorkbenchTreeNode } from './types';

export type BuildTreeResult = {
  treeData: WorkbenchTreeNode[];
  contentByPath: Map<string, string>;
};

/**
 * 将扫描结果转为 Antd Tree 数据，并建立 path → content 映射。
 */
export function buildTree(files: RawFile[]): BuildTreeResult {
  const contentByPath = new Map<string, string>();
  const rootChildren: WorkbenchTreeNode[] = [];
  const dirMap = new Map<string, WorkbenchTreeNode>();

  function ensureDir(dirPath: string, title: string): WorkbenchTreeNode {
    const existing = dirMap.get(dirPath);
    if (existing) return existing;

    const node: WorkbenchTreeNode = {
      key: dirPath,
      title,
      children: [],
    };
    dirMap.set(dirPath, node);

    const parentSlash = dirPath.lastIndexOf('/');
    if (parentSlash === -1) {
      rootChildren.push(node);
    } else {
      const parentPath = dirPath.slice(0, parentSlash);
      const parentTitle = parentPath.includes('/')
        ? parentPath.slice(parentPath.lastIndexOf('/') + 1)
        : parentPath;
      const parent = ensureDir(parentPath, parentTitle);
      parent.children = parent.children ?? [];
      parent.children.push(node);
    }
    return node;
  }

  for (const file of files) {
    const norm = file.relativePath.replace(/\\/g, '/');
    contentByPath.set(norm, file.content);

    const parts = norm.split('/');
    const fileName = parts[parts.length - 1]!;
    if (parts.length === 1) {
      rootChildren.push({
        key: norm,
        title: fileName,
        isLeaf: true,
      });
      continue;
    }

    const dirPath = parts.slice(0, -1).join('/');
    // ensure full chain
    let acc = '';
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
      ensureDir(acc, parts[i]!);
    }
    const parent = dirMap.get(dirPath)!;
    parent.children = parent.children ?? [];
    parent.children.push({
      key: norm,
      title: fileName,
      isLeaf: true,
    });
  }

  return { treeData: rootChildren, contentByPath };
}
```

- [x] **Step 4: 跑测试确认通过**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/scan/buildTree.test.ts
```

Expected: PASS。若因目录插入顺序导致 `treeData` 顺序断言失败，将断言改为对 `key` 集合比较，或在 `buildTree` 对同级 `children` 按 `title` 排序后再测。

- [x] **Step 5: Commit（默认跳过）**

```bash
git add src/pages/Workbench/scan/buildTree.ts src/pages/Workbench/scan/buildTree.test.ts
git commit -m "feat: build workbench catalog tree from scanned files"
```

---

### Task 4: pickProjectRoot + scanHardcodedRoots

**Files:**
- Create: `src/pages/Workbench/scan/pickProjectRoot.ts`
- Create: `src/pages/Workbench/scan/scanHardcodedRoots.ts`

- [x] **Step 1: 实现目录选择封装**

创建 `src/pages/Workbench/scan/pickProjectRoot.ts`：

```ts
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * 弹出目录选择器。约定：用户选择项目根。
 * 用户取消时抛出 DOMException AbortError（由调用方静默处理）。
 */
export async function pickProjectRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isDirectoryPickerSupported()) {
    throw new Error('当前浏览器不支持选择文件夹，请使用 Chrome 或 Edge');
  }
  return window.showDirectoryPicker({ mode: 'read' });
}
```

若 `tsc` 报 `showDirectoryPicker` 不存在：在同目录增加 `file-system-access.d.ts`：

```ts
interface Window {
  showDirectoryPicker: (options?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandle>;
}
```

并确认该文件被 `tsconfig.app.json` 的 `include: ["src"]` 覆盖（放在 `src/pages/Workbench/scan/` 即可）。

- [x] **Step 2: 实现硬编码扫描**

创建 `src/pages/Workbench/scan/scanHardcodedRoots.ts`：

```ts
import {
  isConventionRootName,
  isTargetMarkdown,
  shouldSkipDirName,
} from './pathMatch';
import type { RawFile } from './types';

async function readFileHandle(
  handle: FileSystemFileHandle,
  relativePath: string,
): Promise<RawFile | null> {
  try {
    const file = await handle.getFile();
    const content = await file.text();
    return { relativePath, content };
  } catch {
    return null;
  }
}

async function walkDir(
  dir: FileSystemDirectoryHandle,
  prefix: string,
  out: RawFile[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = prefix ? `${prefix}/${name}` : name;

    if (handle.kind === 'directory') {
      if (shouldSkipDirName(name)) continue;
      await walkDir(handle, rel, out);
      continue;
    }
    if (handle.kind !== 'file') continue;
    if (!isTargetMarkdown(name)) continue;

    const raw = await readFileHandle(handle, rel);
    if (raw) out.push(raw);
  }
}

/**
 * 仅扫描项目根第一层约定目录内的 .md / .mdc。
 * 缺根静默跳过；不把「选中目录本身是约定根」当作主路径。
 */
export async function scanHardcodedRoots(
  projectRoot: FileSystemDirectoryHandle,
): Promise<RawFile[]> {
  const out: RawFile[] = [];

  for await (const [name, handle] of projectRoot.entries()) {
    if (handle.kind !== 'directory') continue;
    if (!isConventionRootName(name)) continue;
    await walkDir(handle, name, out);
  }

  return out;
}
```

- [x] **Step 3: 类型检查**

```powershell
cd D:\myComponent\WorkBench
npx tsc -b --pretty false
```

Expected: 与本改动相关无新增错误。

- [x] **Step 4: Commit（默认跳过）**

```bash
git add src/pages/Workbench/scan/
git commit -m "feat: scan hardcoded convention roots via directory picker"
```

---

### Task 5: 路由改挂 BlankLayout

**Files:**
- Modify: `src/router/index.tsx`

- [x] **Step 1: 修改路由**

将 `/workbench` 分支改为使用 `BlankLayout`（保留 `WorkbenchLayout` import 删除若未再使用）：

```tsx
import BlankLayout from '@/layouts/BlankLayout';
import MainLayout from '@/layouts/MainLayout';
import BlankPlaceholder from '@/pages/BlankPlaceholder';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import RegexSettings from '@/pages/RegexSettings';
import Workbench from '@/pages/Workbench';
import { createBrowserRouter } from 'react-router-dom';

function getBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return undefined;
  }
  return base.replace(/\/$/, '');
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'regex-settings', element: <RegexSettings /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    {
      path: '/workbench',
      element: <BlankLayout />,
      children: [{ index: true, element: <Workbench /> }],
    },
    {
      path: '/blank',
      element: <BlankLayout />,
      children: [{ index: true, element: <BlankPlaceholder /> }],
    },
  ],
  { basename: getBasename() },
);
```

注意：删除未使用的 `WorkbenchLayout` import。`src/layouts/WorkbenchLayout/**` 文件保留不删。

- [x] **Step 2: 确认 BlankLayout 全高**

若工作台无法撑满视口，将 `src/layouts/BlankLayout/index.less` 的 `.shell` 设为：

```less
.shell {
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

（仅在需要时改；以页面视觉为准。）

- [x] **Step 3: Commit（默认跳过）**

```bash
git add src/router/index.tsx src/layouts/BlankLayout/index.less
git commit -m "feat: mount workbench under BlankLayout"
```

---

### Task 6: UI 子组件 + 页面编排

**Files:**
- Create: `src/pages/Workbench/components/WorkbenchHeader/index.tsx`
- Create: `src/pages/Workbench/components/WorkbenchHeader/index.less`
- Create: `src/pages/Workbench/components/CatalogTree/index.tsx`
- Create: `src/pages/Workbench/components/CatalogTree/index.less`
- Create: `src/pages/Workbench/components/RawPreview/index.tsx`
- Create: `src/pages/Workbench/components/RawPreview/index.less`
- Create: `src/pages/Workbench/index.less`
- Modify: `src/pages/Workbench/index.tsx`

- [x] **Step 1: WorkbenchHeader**

创建 `index.tsx` + `index.less`（静态布局进 less，禁止大块 `style={{}}`）：

```tsx
import { FolderOpenOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import styles from './index.less';

type Props = {
  rootName: string | null;
  loading: boolean;
  onPickFolder: () => void;
};

/**
 * 工作台顶栏：标题 + 选择文件夹
 */
function WorkbenchHeader({ rootName, loading, onPickFolder }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <img
            className={styles.logo}
            src={`${import.meta.env.BASE_URL}fabricIcon.png`}
            alt=""
          />
          <img
            className={styles.title}
            src={`${import.meta.env.BASE_URL}fabricNameIcon.png`}
            alt="知识织物工作台"
          />
        </div>
        {rootName ? (
          <Typography.Text type="secondary">{rootName}</Typography.Text>
        ) : null}
      </div>
      <Button
        type="primary"
        icon={<FolderOpenOutlined />}
        loading={loading}
        onClick={onPickFolder}
      >
        选择文件夹
      </Button>
    </header>
  );
}

export default WorkbenchHeader;
```

```less
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.brandRow {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: block;
  height: 28px;
  width: auto;
  flex-shrink: 0;
}

.title {
  display: block;
  height: 28px;
  width: auto;
  flex-shrink: 0;
}
```

- [x] **Step 2: CatalogTree**

创建 `CatalogTree/index.tsx` + `index.less`：

```tsx
import { Empty, Spin, Tree } from 'antd';
import styles from './index.less';
import type { WorkbenchTreeNode } from '../scan/types';

type Props = {
  hasPicked: boolean;
  loading: boolean;
  treeData: WorkbenchTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
};

/**
 * 左侧目录树；仅叶子可选中。
 */
function CatalogTree({
  hasPicked,
  loading,
  treeData,
  selectedPath,
  onSelectFile,
}: Props) {
  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin />
      </div>
    );
  }

  if (!hasPicked) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先选择项目根目录"
      />
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty
        className={styles.empty}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="未扫描到 .md / .mdc"
      />
    );
  }

  const defaultExpandedKeys = treeData.map((n) => n.key);

  return (
    <Tree
      className={styles.tree}
      key={treeData.map((n) => n.key).join('|')}
      treeData={treeData}
      selectedKeys={selectedPath ? [selectedPath] : []}
      defaultExpandedKeys={defaultExpandedKeys}
      onSelect={(keys, info) => {
        if (!info.node.isLeaf) return;
        const key = String(keys[0] ?? '');
        if (key) onSelectFile(key);
      }}
    />
  );
}

export default CatalogTree;
```

```less
.loading {
  padding: 24px;
  text-align: center;
}

.empty {
  margin-top: 48px;
}

.tree {
  padding: 8px;
}
```

- [x] **Step 3: RawPreview**

创建 `RawPreview/index.tsx` + `index.less`：

```tsx
import { Empty, Typography } from 'antd';
import styles from './index.less';

type Props = {
  path: string | null;
  content: string | null;
};

/**
 * 右侧原文预览（非 Markdown 渲染）
 */
function RawPreview({ path, content }: Props) {
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
      <Typography.Text code className={styles.path}>
        {path}
      </Typography.Text>
      <pre className={styles.content}>{content}</pre>
    </div>
  );
}

export default RawPreview;
```

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

.path {
  display: block;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  word-break: break-all;
}

.content {
  margin: 0;
  padding: 12px;
  flex: 1;
  overflow: auto;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
```

- [x] **Step 4: 页面样式**

创建 `src/pages/Workbench/index.less`：

```less
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.catalog {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  overflow: auto;
}

.preview {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
```

- [x] **Step 5: 编排 `index.tsx`**

将 `src/pages/Workbench/index.tsx` 替换为：

```tsx
import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import CatalogTree from './components/CatalogTree';
import RawPreview from './components/RawPreview';
import WorkbenchHeader from './components/WorkbenchHeader';
import { buildTree } from './scan/buildTree';
import { pickProjectRoot } from './scan/pickProjectRoot';
import { scanHardcodedRoots } from './scan/scanHardcodedRoots';
import type { RawFile, WorkbenchTreeNode } from './scan/types';
import styles from './index.less';

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/**
 * 工作台：选择项目根并展示约定目录下的 md/mdc 树与原文
 */
function Workbench() {
  const [loading, setLoading] = useState(false);
  const [hasPicked, setHasPicked] = useState(false);
  const [rootName, setRootName] = useState<string | null>(null);
  const [files, setFiles] = useState<RawFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const { treeData, contentByPath } = useMemo(() => buildTree(files), [files]);

  const selectedContent =
    selectedPath !== null ? (contentByPath.get(selectedPath) ?? null) : null;

  const handlePickFolder = useCallback(async () => {
    try {
      const handle = await pickProjectRoot();
      setLoading(true);
      const scanned = await scanHardcodedRoots(handle);
      setFiles(scanned);
      setRootName(handle.name);
      setHasPicked(true);
      setSelectedPath(null);
    } catch (err) {
      if (isAbortError(err)) return;
      const msg = err instanceof Error ? err.message : '扫描失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedPath(path);
  }, []);

  return (
    <div className={styles.page}>
      <WorkbenchHeader
        rootName={rootName}
        loading={loading}
        onPickFolder={handlePickFolder}
      />
      <div className={styles.body}>
        <aside className={styles.catalog}>
          <CatalogTree
            hasPicked={hasPicked}
            loading={loading}
            treeData={treeData as WorkbenchTreeNode[]}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFile}
          />
        </aside>
        <main className={styles.preview}>
          <RawPreview path={selectedPath} content={selectedContent} />
        </main>
      </div>
    </div>
  );
}

export default Workbench;
```

说明：扫描失败时不清空已有 `files`（保留上一次成功结果）；仅在 `try` 成功路径里 `setFiles`。

- [x] **Step 6: 跑单测 + 类型检查**

```powershell
cd D:\myComponent\WorkBench
yarn test
npx tsc -b --pretty false
```

Expected: 全部单测 PASS；`tsc` 无本切片新增错误。

- [x] **Step 7: Commit（默认跳过）**

```bash
git add src/pages/Workbench/ src/router/index.tsx
git commit -m "feat: workbench pick folder with directory tree and raw preview"
```

---

### Task 7: 手工验证 + 规格收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md`（状态）

- [x] **Step 1: 本地启动**

```powershell
cd D:\myComponent\WorkBench
yarn dev
```

在 Chrome/Edge 打开 `/workbench`，按清单验证：

| # | 操作 | 期望 |
|---|------|------|
| 1 | 初次进入 | 左 Empty「请先选择项目根目录」；右 Empty「从左侧选择文件」；仅有「选择文件夹」按钮 |
| 2 | 选项目根（如本机 `forgeKit`） | loading 后左树出现约定根层级；顶栏可显示根目录名 |
| 3 | 点某 .md/.mdc | 右侧显示路径 + 原文 |
| 4 | 点目录节点 | 仅展开/折叠，右侧不因目录切换内容 |
| 5 | 取消系统目录框 | 状态不变、无 error toast |
| 6 | （可选）用不支持的浏览器或 mock 不支持 | error 提示换浏览器 |

- [x] **Step 2: 更新 design 状态**

将 spec 文首：

```markdown
状态：已设计（待实现）
```

改为：

```markdown
状态：已实现
```

- [x] **Step 3: Commit（默认跳过）**

```bash
git add docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md
git commit -m "docs: mark workbench pick-folder design as implemented"
```

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| BlankLayout + 页内三栏 | Task 5、6 |
| 硬编码三根 + md/mdc | Task 2、4 |
| 真实目录树 | Task 3、6 |
| 路径 + 原文 | Task 6 |
| 空态 / loading | Task 6 |
| 仅选文件夹按钮 | Task 6 |
| 选项目根约定 | Task 4、6 |
| 取消静默 / 不支持报错 / 单文件跳过 / 失败保留上次 | Task 4、6 |
| 纯函数单测 | Task 1–3 |
| 非目标未纳入 | 本 plan 无 MD 渲染/关系/导出/正则驱动 |

## Placeholder / 类型一致性

- 类型名统一：`RawFile`、`WorkbenchTreeNode`、`buildTree` → `{ treeData, contentByPath }`
- API 名统一：`pickProjectRoot`、`scanHardcodedRoots`、`isDirectoryPickerSupported`

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-03 | 全部 Task 1–7 已实现；新增 file-system-access.d.ts；BlankLayout less 未改（全局高度链已够）；Commit 步骤按约定跳过。 |
| 2026-08-03 | 修复文档 UTF-8 乱码（PowerShell Set-Content 编码损坏）。 |
| 2026-08-05 | 顶栏标题改为图标 +「知识织物工作台」（与 MainLayout `fabricIcon.png` 一致） |
| 2026-08-05 | Task 6 子组件静态样式迁入同级 `index.less`（CSS Module） |
| 2026-08-06 | 顶栏文字标题改为图片 `fabricNameIcon.png`（保留前置 `fabricIcon.png`） |
