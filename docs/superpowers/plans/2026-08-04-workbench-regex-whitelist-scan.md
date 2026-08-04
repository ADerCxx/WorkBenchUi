# 正则白名单驱动扫描 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将工作台选文件夹扫描改为由启用中的 `folderPattern` + `filePattern` 白名单驱动，并同步正则设置页与 API 类型字段。

**Architecture:** 扫描前经 `RegexRulesQueryApi` 翻页拉取全部启用规则并编译；`scanByWhitelist` 自项目根递归，用字面量路径提示做目录剪枝，文件须同时命中某条规则的 folder+file；设置页与 `regexRules` 类型去掉 `regexPattern`。

**Tech Stack:** React 19、antd、ahooks、Vitest、现有 `@/utils/request` + `RegexRulesQueryApi`

**Spec:** `docs/superpowers/specs/2026-08-04-workbench-regex-whitelist-scan-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径                                                                         | 职责                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/apis/regexRules/types.ts`                                               | `folderPattern` / `filePattern` 替换 `regexPattern`              |
| `src/apis/regexRules/queryEnabled/index.ts`                                  | 翻页拉取全部启用规则                                             |
| `src/pages/RegexSettings/index.tsx`                                          | 列表/表单两字段                                                  |
| `src/pages/Workbench/scan/whitelistMatch.ts`                                 | 编译规则、父路径、文件命中、目录是否进入                         |
| `src/pages/Workbench/scan/whitelistMatch.test.ts`                            | 白名单匹配单测                                                   |
| `src/pages/Workbench/scan/scanByWhitelist.ts`                                | 规则驱动 walk + 读文件                                           |
| `src/pages/Workbench/index.tsx`                                              | 选文件夹：拉规则 → 扫描                                          |
| `src/pages/Workbench/components/CatalogTree/index.tsx`                       | 空态文案                                                         |
| `src/pages/Workbench/scan/constants.ts`                                      | 删除或清空主路径常量（不再被扫描引用）                           |
| `src/pages/Workbench/scan/pathMatch.ts`                                      | 删除或改为仅被废弃路径使用；本轮改为删除并由 whitelistMatch 替代 |
| `src/pages/Workbench/scan/scanHardcodedRoots.ts`                             | 删除（由 scanByWhitelist 替代）                                  |
| `docs/superpowers/specs/2026-08-04-workbench-regex-whitelist-scan-design.md` | 状态 → 已实现（收尾）                                            |
| `docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md`          | 修订记录：扫描改由白名单驱动                                     |
| `docs/superpowers/specs/2026-08-04-regex-settings-api-integration-design.md` | 修订记录：字段变更                                               |

---

### Task 1: API 类型改为双字段

**Files:**

- Modify: `src/apis/regexRules/types.ts`

- [x] **Step 1: 替换 RegexRule / Insert / Update 中的 pattern 字段**

将 `regexPattern` 全部改为：

```ts
folderPattern: string;
filePattern: string;
```

`RegexRulesInsertParams` / `RegexRulesUpdateParams` 同步（update 中二者均为可选）。

- [x] **Step 2: 确认无残留引用（稍后 Task 2/3 改页面；本步先改类型）**

Run:

```powershell
cd D:\myComponent\WorkBench
rg "regexPattern" src
```

Expected: 仅旧页面等尚未改处仍引用；types 中应为 0。

---

### Task 2: 拉取全部启用规则

**Files:**

- Create: `src/apis/regexRules/queryEnabled/index.ts`

- [x] **Step 1: 实现翻页拉取**

```ts
import { RegexRuleEnableStatus, type RegexRule } from '../types';
import { RegexRulesQueryApi } from '../query';

const PAGE_SIZE = 100;

/**
 * 拉取全部启用中的白名单规则（翻页直至取完）
 */
export async function RegexRulesQueryEnabledApi(): Promise<RegexRule[]> {
  const all: RegexRule[] = [];
  let current = 1;

  for (;;) {
    const { list, total } = await RegexRulesQueryApi(
      { current, pageSize: PAGE_SIZE },
      { enableStatus: RegexRuleEnableStatus.Enable },
    );
    all.push(...list);
    if (all.length >= total || list.length === 0) break;
    current += 1;
  }

  return all;
}
```

- [x] **Step 2: 手测或临时调用确认导出无类型错误**

Run:

```powershell
cd D:\myComponent\WorkBench
yarn tsc -b --pretty false 2>&1 | Select-Object -First 40
```

Expected: 若仅 RegexSettings 仍用旧字段会报错，可在 Task 3 一并消除；本文件自身无错。

---

### Task 3: 正则设置页双字段 UI

**Files:**

- Modify: `src/pages/RegexSettings/index.tsx`

- [x] **Step 1: 表格列与表单**

- 删除「正则」单列，改为两列：`folderPattern`、`filePattern`（`Typography.Text code` + ellipsis）
- 表单两项均 `required` + 复用现有 `validatePattern`（文案改为「请输入目录正则」/「请输入文件正则」可各包一层或共用 validator）
- placeholder：目录如 `(?:^|/)\.cursor/skills(?:/|$)`；文件如 `\.mdc?$`
- 说明文案改为：用于扫描文件夹的白名单（目录正则 + 文件正则）

- [x] **Step 2: 浏览器打开 `/regex-settings` 确认表头与新建弹窗为两字段**

Expected: 无运行时引用 `regexPattern`。

---

### Task 4: whitelistMatch 纯函数（TDD）

**Files:**

- Create: `src/pages/Workbench/scan/whitelistMatch.ts`
- Create: `src/pages/Workbench/scan/whitelistMatch.test.ts`

- [x] **Step 1: 写失败单测**

```ts
import { describe, expect, it } from 'vitest';
import {
  compileWhitelistRules,
  extractLiteralPathHint,
  matchesWhitelistFile,
  parentDir,
  shouldEnterDirectory,
} from './whitelistMatch';

describe('parentDir', () => {
  it('returns parent or empty', () => {
    expect(parentDir('.cursor/skills/foo.md')).toBe('.cursor/skills');
    expect(parentDir('foo.md')).toBe('');
  });
});

describe('extractLiteralPathHint', () => {
  it('extracts path-like literals from folder pattern', () => {
    expect(
      extractLiteralPathHint(String.raw`(?:^|/)\.cursor/skills(?:/|$)`),
    ).toBe('.cursor/skills');
  });
});

describe('shouldEnterDirectory', () => {
  const rules = compileWhitelistRules([
    {
      folderPattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
      filePattern: String.raw`\.mdc?$`,
    },
  ]);

  it('enters prefix and matched folder, skips unrelated', () => {
    expect(shouldEnterDirectory('.cursor', rules)).toBe(true);
    expect(shouldEnterDirectory('.cursor/skills', rules)).toBe(true);
    expect(shouldEnterDirectory('node_modules', rules)).toBe(false);
    expect(shouldEnterDirectory('docs', rules)).toBe(false);
  });

  it('enters children once under matched folder', () => {
    expect(shouldEnterDirectory('.cursor/skills/foo', rules)).toBe(true);
  });
});

describe('matchesWhitelistFile', () => {
  const rules = compileWhitelistRules([
    {
      folderPattern: String.raw`(?:^|/)\.cursor/skills(?:/|$)`,
      filePattern: String.raw`\.mdc?$`,
    },
  ]);

  it('requires folder+file hit', () => {
    expect(matchesWhitelistFile('.cursor/skills/a/SKILL.md', rules)).toBe(true);
    expect(matchesWhitelistFile('.cursor/skills/a/note.txt', rules)).toBe(
      false,
    );
    expect(matchesWhitelistFile('docs/a.md', rules)).toBe(false);
  });
});

describe('compileWhitelistRules', () => {
  it('skips invalid patterns', () => {
    const { rules, skipped } = compileWhitelistRules([
      { folderPattern: '(', filePattern: '.*' },
      { folderPattern: 'docs', filePattern: String.raw`\.md$` },
    ]);
    expect(skipped.length).toBe(1);
    expect(rules.length).toBe(1);
  });
});
```

- [x] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/scan/whitelistMatch.test.ts
```

Expected: FAIL（模块不存在）

- [x] **Step 3: 实现 whitelistMatch.ts**

```ts
export type WhitelistPatternInput = {
  folderPattern: string;
  filePattern: string;
  ruleName?: string;
};

export type CompiledWhitelistRule = {
  folder: RegExp;
  file: RegExp;
  folderSource: string;
  literalHint: string | null;
  ruleName?: string;
};

export function parentDir(filePath: string): string {
  const i = filePath.lastIndexOf('/');
  return i <= 0 ? '' : filePath.slice(0, i);
}

/**
 * 从路径风格 folder 正则中提取字面量路径提示（正确性优先的剪枝辅助）。
 * 例：`(?:^|/)\.cursor/skills(?:/|$)` → `.cursor/skills`
 */
export function extractLiteralPathHint(pattern: string): string | null {
  const normalized = pattern.replace(/\\\//g, '/');
  const segments: string[] = [];
  const re = /\\.?[A-Za-z0-9_-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const raw = m[0];
    segments.push(raw.startsWith('\\') ? raw.slice(1) : raw);
  }
  if (segments.length === 0) return null;
  return segments.join('/');
}

export function compileWhitelistRules(inputs: WhitelistPatternInput[]): {
  rules: CompiledWhitelistRule[];
  skipped: WhitelistPatternInput[];
} {
  const rules: CompiledWhitelistRule[] = [];
  const skipped: WhitelistPatternInput[] = [];

  for (const input of inputs) {
    try {
      const folder = new RegExp(input.folderPattern);
      const file = new RegExp(input.filePattern);
      rules.push({
        folder,
        file,
        folderSource: input.folderPattern,
        literalHint: extractLiteralPathHint(input.folderPattern),
        ruleName: input.ruleName,
      });
    } catch {
      skipped.push(input);
    }
  }

  return { rules, skipped };
}

function isPathPrefix(prefix: string, full: string): boolean {
  return full === prefix || full.startsWith(`${prefix}/`);
}

/**
 * 是否进入目录：folder 命中、字面量 hint 前缀、或已在命中子树下（hint 前缀的子孙 / folder.test）。
 */
export function shouldEnterDirectory(
  dirPath: string,
  rules: CompiledWhitelistRule[],
): boolean {
  return rules.some((r) => {
    if (r.folder.test(dirPath)) return true;
    if (r.literalHint && isPathPrefix(dirPath, r.literalHint)) return true;
    if (r.literalHint && isPathPrefix(r.literalHint, dirPath)) return true;
    return false;
  });
}

/**
 * 文件命中：存在规则使父目录（或自身路径上的目录语义）folder 命中且 file 命中。
 * 父目录用 parentDir；若 parent 未命中，再对「从根到 parent 的每一段祖先」试 folder（兼容只写到 skills 的正则对更深父路径）。
 */
export function matchesWhitelistFile(
  filePath: string,
  rules: CompiledWhitelistRule[],
): boolean {
  const parent = parentDir(filePath);
  const ancestors: string[] = [];
  if (parent) {
    const parts = parent.split('/');
    for (let i = 0; i < parts.length; i += 1) {
      ancestors.push(parts.slice(0, i + 1).join('/'));
    }
  }

  return rules.some((r) => {
    if (!r.file.test(filePath)) return false;
    if (r.folder.test(parent)) return true;
    return ancestors.some((a) => r.folder.test(a));
  });
}
```

- [x] **Step 4: 跑测通过**

```powershell
yarn test src/pages/Workbench/scan/whitelistMatch.test.ts
```

Expected: PASS

若 `extractLiteralPathHint` 对样例失败，微调提取正则直到单测绿，保持「`.cursor/skills`」样例稳定。

---

### Task 5: scanByWhitelist

**Files:**

- Create: `src/pages/Workbench/scan/scanByWhitelist.ts`
- Delete: `src/pages/Workbench/scan/scanHardcodedRoots.ts`（在 Workbench 改引用后删）

- [x] **Step 1: 实现扫描**

```ts
import type { CompiledWhitelistRule } from './whitelistMatch';
import { matchesWhitelistFile, shouldEnterDirectory } from './whitelistMatch';
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
  rules: CompiledWhitelistRule[],
  out: RawFile[],
): Promise<void> {
  for await (const [name, handle] of dir.entries()) {
    const rel = prefix ? `${prefix}/${name}` : name;

    if (handle.kind === 'directory') {
      if (!shouldEnterDirectory(rel, rules)) continue;
      await walkDir(handle, rel, rules, out);
      continue;
    }
    if (handle.kind !== 'file') continue;
    if (!matchesWhitelistFile(rel, rules)) continue;

    const raw = await readFileHandle(handle, rel);
    if (raw) out.push(raw);
  }
}

/**
 * 按启用白名单规则扫描项目根下文件。
 */
export async function scanByWhitelist(
  projectRoot: FileSystemDirectoryHandle,
  rules: CompiledWhitelistRule[],
): Promise<RawFile[]> {
  if (rules.length === 0) return [];

  const out: RawFile[] = [];
  await walkDir(projectRoot, '', rules, out);
  return out;
}
```

- [x] **Step 2: 删除旧 scanHardcodedRoots 引用准备（下一 Task 改 index）**

---

### Task 6: Workbench 编排接入

**Files:**

- Modify: `src/pages/Workbench/index.tsx`
- Modify: `src/pages/Workbench/components/CatalogTree/index.tsx`
- Modify: `src/pages/Workbench/components/CatalogTree/types.ts`（若需空态文案 prop）
- Delete: `src/pages/Workbench/scan/scanHardcodedRoots.ts`
- Delete: `src/pages/Workbench/scan/pathMatch.ts`（确认无引用后）
- Delete: `src/pages/Workbench/scan/constants.ts`（确认无引用后）

- [x] **Step 1: index 选文件夹流程**

```ts
import { RegexRulesQueryEnabledApi } from '@/apis/regexRules/queryEnabled';
import { compileWhitelistRules } from './scan/whitelistMatch';
import { scanByWhitelist } from './scan/scanByWhitelist';

// handlePickFolder 内：
const handle = await pickProjectRoot();
setLoading(true);
const enabled = await RegexRulesQueryEnabledApi();
const { rules, skipped } = compileWhitelistRules(enabled);
if (skipped.length > 0) {
  message.warning(`已跳过 ${skipped.length} 条非法正则规则`);
}
if (rules.length === 0) {
  setFiles([]);
  setRootName(handle.name);
  setHasPicked(true);
  setSelectedPath(null);
  message.info('无启用白名单规则');
  return;
}
const scanned = await scanByWhitelist(handle, rules);
setFiles(scanned);
// ... 其余同现网成功路径
```

拉规则抛错：走现有 `message.error`，不要 `setFiles`（保留上次结果）；`hasPicked` 不变。

- [x] **Step 2: CatalogTree 空态**

将「未扫描到 .md / .mdc」改为「未扫描到匹配文件」（或根据 `emptyHint` prop：无规则 vs 零命中）。最小改法：统一文案「未扫描到匹配的白名单文件」。

- [x] **Step 3: 删除废弃 scan 文件并确认无引用**

```powershell
rg "scanHardcodedRoots|CONVENTION_ROOTS|pathMatch|from './scan/constants'" src
```

Expected: 无业务引用后删除对应文件。

- [x] **Step 4: 类型检查与单测**

```powershell
yarn test src/pages/Workbench/scan/whitelistMatch.test.ts
yarn tsc -b
```

Expected: PASS / 无错。

---

### Task 7: 文档同步

**Files:**

- Modify: `docs/superpowers/specs/2026-08-04-workbench-regex-whitelist-scan-design.md`（状态：已实现；修订记录追加）
- Modify: `docs/superpowers/specs/2026-08-03-workbench-pick-folder-design.md`（非目标/决策表注明已由白名单扫描替代；修订记录）
- Modify: `docs/superpowers/specs/2026-08-04-regex-settings-api-integration-design.md`（字段改为 folder+file；修订记录）

- [x] **Step 1: 按 sync-design-plan 回写上述三份 design**
- [x] **Step 2: 本 plan 各 Task 勾选为完成**

---

## 已知实现注意点

1. 后端字段未就绪时，设置页/扫描联调会失败；前端契约已按 spec 先行，联调依赖同事改 Vo/Dto。
2. `extractLiteralPathHint` 对任意正则不完备；内置规则应使用可提取字面量的路径风格。复杂正则仅 `folder.test(dirPath)` / hint 子树能覆盖的路径会进入。
3. 不设 `node_modules` 黑名单；剪枝依赖白名单 hint。
4. `RegexRulesQueryEnabledApi` 的 `PAGE_SIZE=100`；规则量极大时靠翻页。
5. Java 正则与 JS `RegExp` 基本路径写法通常兼容；若后端用了 JS 不支持的构造，编译失败会进 `skipped`。

---

## Spec 覆盖自检

| Spec 项               | Task |
| --------------------- | ---- |
| folder+file 字段      | 1, 3 |
| 仅启用规则            | 2, 6 |
| 目录剪枝 + 文件双命中 | 4, 5 |
| 无启用规则空态        | 6    |
| 非法正则跳过          | 4, 6 |
| 拉规则失败不扫盘      | 6    |
| 设置页两字段          | 3    |
| 文档同步              | 7    |
