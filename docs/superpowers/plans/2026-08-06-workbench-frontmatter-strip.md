# 工作台 Markdown Frontmatter 元数据条 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Markdown 预览时抽离文件头 YAML frontmatter，以轻量元数据信息条单独渲染，正文只渲染剩余 Markdown。

**Architecture:** 在 `MarkdownPreview` 模块内：`parseFrontmatter` 纯函数拆分；`FrontmatterStrip` 渲染常用五字段 +「更多」；`MarkdownPreview` 编排。`PreviewPane` 与原文模式不改。

**Tech Stack:** React 19、`js-yaml`、Vitest、Less CSS Modules、既有 `react-markdown` 栈

**Spec:** `docs/superpowers/specs/2026-08-06-workbench-frontmatter-strip-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

**Skills（实现时遵守）:** `module-file-layout`、`css-module-less`、`typography`；收尾按 `sync-design-plan` 将 spec 标为已实现。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加 `js-yaml`、`@types/js-yaml` |
| `src/components/MarkdownPreview/parseFrontmatter.ts` | 抽离 frontmatter 纯函数 |
| `src/components/MarkdownPreview/parseFrontmatter.test.ts` | 解析单测 |
| `src/components/MarkdownPreview/types.ts` | 增补 `ParseFrontmatterResult` 等类型 |
| `src/components/MarkdownPreview/FrontmatterStrip/types.ts` | Strip Props |
| `src/components/MarkdownPreview/FrontmatterStrip/index.tsx` | 元数据信息条 |
| `src/components/MarkdownPreview/FrontmatterStrip/index.less` | 信息条样式 |
| `src/components/MarkdownPreview/index.tsx` | 编排 parse + Strip + ReactMarkdown |
| `src/components/MarkdownPreview/index.less` | 可选：为 Strip 与正文间距微调（优先放 Strip 自己的 less） |
| `docs/superpowers/specs/2026-08-06-workbench-frontmatter-strip-design.md` | 状态 → 已实现 |
| `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md` | 后续项注明已由本 spec 承接（可选一句） |

不改：`PreviewPane/**`、`Workbench/index.tsx`。

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`（由包管理器写入）

- [x] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
yarn add js-yaml
yarn add -D @types/js-yaml
```

Expected: `dependencies` 有 `js-yaml`，`devDependencies` 有 `@types/js-yaml`。

- [x] **Step 2: 确认可解析**

```powershell
yarn why js-yaml
```

Expected: 显示已安装版本信息。

---

### Task 2: `parseFrontmatter` 类型 + 失败测试先行

**Files:**
- Modify: `src/components/MarkdownPreview/types.ts`
- Create: `src/components/MarkdownPreview/parseFrontmatter.test.ts`
- Create: `src/components/MarkdownPreview/parseFrontmatter.ts`（下一步实现）

- [x] **Step 1: 扩展 types**

在 `src/components/MarkdownPreview/types.ts` 追加（保留既有 `MarkdownPreviewProps`）：

```ts
export type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

export type ParseFrontmatterResult = {
  /** 解析成功的 frontmatter 对象；失败或无则 null */
  matter: Record<string, unknown> | null;
  /** 供 Markdown 渲染的正文；失败/无时等于原始 source */
  body: string;
};
```

- [x] **Step 2: 写失败测试（实现前）**

创建 `src/components/MarkdownPreview/parseFrontmatter.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from './parseFrontmatter';

describe('parseFrontmatter', () => {
  it('returns full source when no frontmatter', () => {
    const source = '# Hello\n\nworld';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('parses valid skill-like frontmatter', () => {
    const source = `---
name: demo-skill
description: >-
  Use when testing.
globs:
  - "src/**/*.ts"
alwaysApply: false
disable-model-invocation: true
extra: keep-me
---

# Body

text
`;
    const result = parseFrontmatter(source);
    expect(result.matter).toEqual({
      name: 'demo-skill',
      description: 'Use when testing.',
      globs: ['src/**/*.ts'],
      alwaysApply: false,
      'disable-model-invocation': true,
      extra: 'keep-me',
    });
    expect(result.body).toBe('\n# Body\n\ntext\n');
  });

  it('allows leading BOM and whitespace before opening fence', () => {
    const source = `\uFEFF  \n---\nname: x\n---\n\n# Hi\n`;
    const result = parseFrontmatter(source);
    expect(result.matter).toEqual({ name: 'x' });
    expect(result.body).toBe('\n# Hi\n');
  });

  it('does not strip when only opening fence exists', () => {
    const source = '---\nname: x\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('does not treat hr in body as frontmatter', () => {
    const source = '# Title\n\n---\n\nmore\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('falls back on invalid yaml', () => {
    const source = '---\nname: [unclosed\n---\n\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });

  it('falls back when yaml root is not a plain object', () => {
    const source = '---\n- just\n- a\n- list\n---\n\n# Body\n';
    expect(parseFrontmatter(source)).toEqual({
      matter: null,
      body: source,
    });
  });
});
```

- [x] **Step 3: 跑测试确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/components/MarkdownPreview/parseFrontmatter.test.ts
```

Expected: FAIL（`parseFrontmatter` 未定义或模块不存在）。

---

### Task 3: 实现 `parseFrontmatter`

**Files:**
- Create: `src/components/MarkdownPreview/parseFrontmatter.ts`

- [x] **Step 1: 写实现**

创建 `src/components/MarkdownPreview/parseFrontmatter.ts`：

```ts
import { load as loadYaml } from 'js-yaml';
import type { ParseFrontmatterResult } from './types';

const OPENING = /^---[ \t]*\r?\n/;

function stripBom(source: string): string {
  return source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * 抽离文件头 YAML frontmatter。失败或不存在时 matter 为 null，body 为原始 source。
 */
export function parseFrontmatter(source: string): ParseFrontmatterResult {
  const withoutBom = stripBom(source);
  const leadMatch = withoutBom.match(/^[\t \r\n]*/);
  const lead = leadMatch?.[0] ?? '';
  const afterLead = withoutBom.slice(lead.length);

  if (!OPENING.test(afterLead)) {
    return { matter: null, body: source };
  }

  const afterOpen = afterLead.replace(OPENING, '');
  const closeMatch = afterOpen.match(/\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!closeMatch || closeMatch.index === undefined) {
    return { matter: null, body: source };
  }

  const yamlText = afterOpen.slice(0, closeMatch.index);
  const body = afterOpen.slice(closeMatch.index + closeMatch[0].length);

  try {
    const parsed = loadYaml(yamlText);
    if (!isPlainObject(parsed)) {
      return { matter: null, body: source };
    }
    return { matter: parsed, body };
  } catch {
    return { matter: null, body: source };
  }
}
```

- [x] **Step 2: 跑测试确认通过**

```powershell
yarn test src/components/MarkdownPreview/parseFrontmatter.test.ts
```

Expected: 全部 PASS。若 `description: >-` 折叠空白与期望不完全一致，以 `js-yaml` 实际输出为准微调测试断言（保持语义：含 `name` 与 body 抽离）。

- [x] **Step 3: Commit（跳过）**

按仓库约定跳过，除非用户要求提交。

---

### Task 4: `FrontmatterStrip` 组件

**Files:**
- Create: `src/components/MarkdownPreview/FrontmatterStrip/types.ts`
- Create: `src/components/MarkdownPreview/FrontmatterStrip/index.less`
- Create: `src/components/MarkdownPreview/FrontmatterStrip/index.tsx`

- [x] **Step 1: 写 types**

创建 `src/components/MarkdownPreview/FrontmatterStrip/types.ts`：

```ts
export type FrontmatterStripProps = {
  matter: Record<string, unknown>;
};

export const FEATURED_KEYS = [
  'name',
  'description',
  'globs',
  'alwaysApply',
  'disable-model-invocation',
] as const;

export type FeaturedKey = (typeof FEATURED_KEYS)[number];
```

- [x] **Step 2: 写样式**

创建 `src/components/MarkdownPreview/FrontmatterStrip/index.less`：

```less
@strip-accent: #0f766e;
@strip-bg: color-mix(in srgb, @strip-accent 6%, var(--bg));
@strip-more-bg: color-mix(in srgb, var(--border) 45%, var(--bg));

.root {
  margin: 0 0 1.25em;
  padding: 10px 12px 10px 14px;
  border-left: 3px solid @strip-accent;
  background: @strip-bg;
  border-radius: 0 6px 6px 0;
}

.title {
  margin: 0 0 8px;
  font-family: var(--heading);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--text-h);
}

.row {
  display: grid;
  grid-template-columns: minmax(96px, max-content) 1fr;
  gap: 4px 12px;
  align-items: start;
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
}

.key {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text);
  padding-top: 2px;
}

.value {
  font-family: var(--sans);
  color: var(--text-h);
  white-space: pre-wrap;
  word-break: break-word;
}

.valueMono {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-h);
  white-space: pre-wrap;
  word-break: break-word;
}

.moreToggle {
  margin-top: 8px;
  padding: 0;
  border: none;
  background: transparent;
  font-family: var(--sans);
  font-size: 12px;
  color: @strip-accent;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
}

.morePanel {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  background: @strip-more-bg;
}
```

- [x] **Step 3: 写组件**

创建 `src/components/MarkdownPreview/FrontmatterStrip/index.tsx`：

```tsx
import { useState } from 'react';
import styles from './index.less';
import type { FeaturedKey, FrontmatterStripProps } from './types';
import { FEATURED_KEYS } from './types';

export type { FrontmatterStripProps } from './types';
export { FEATURED_KEYS } from './types';

function formatScalar(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatFeaturedValue(key: FeaturedKey, value: unknown): string {
  if (key === 'globs' && Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return formatScalar(value);
}

function formatExtraValue(value: unknown): { text: string; mono: boolean } {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return { text: formatScalar(value), mono: typeof value === 'boolean' };
  }
  return { text: JSON.stringify(value), mono: true };
}

function FrontmatterStrip({ matter }: FrontmatterStripProps) {
  const featuredEntries = FEATURED_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(matter, key),
  ).map((key) => [key, matter[key]] as const);

  const featuredKeySet = new Set<string>(FEATURED_KEYS);
  const extraEntries = Object.entries(matter).filter(
    ([key]) => !featuredKeySet.has(key),
  );

  const onlyExtras = featuredEntries.length === 0 && extraEntries.length > 0;
  const [moreOpen, setMoreOpen] = useState(onlyExtras);

  if (featuredEntries.length === 0 && extraEntries.length === 0) {
    return null;
  }

  return (
    <aside className={styles.root} aria-label="元数据">
      <div className={styles.title}>元数据</div>
      {featuredEntries.map(([key, value]) => (
        <div key={key} className={styles.row}>
          <div className={styles.key}>{key}</div>
          <div className={styles.value}>
            {formatFeaturedValue(key, value)}
          </div>
        </div>
      ))}
      {extraEntries.length > 0 ? (
        <>
          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
          >
            {moreOpen ? '收起更多' : `更多（${extraEntries.length}）`}
          </button>
          {moreOpen ? (
            <div className={styles.morePanel}>
              {extraEntries.map(([key, value]) => {
                const formatted = formatExtraValue(value);
                return (
                  <div key={key} className={styles.row}>
                    <div className={styles.key}>{key}</div>
                    <div
                      className={
                        formatted.mono ? styles.valueMono : styles.value
                      }
                    >
                      {formatted.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}

export default FrontmatterStrip;
```

- [x] **Step 4: Commit（跳过）**

---

### Task 5: 编排进 `MarkdownPreview`

**Files:**
- Modify: `src/components/MarkdownPreview/index.tsx`

- [x] **Step 1: 改内核编排**

将 `src/components/MarkdownPreview/index.tsx` 替换为：

```tsx
import 'highlight.js/styles/github-dark.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import FrontmatterStrip from './FrontmatterStrip';
import styles from './index.less';
import { parseFrontmatter } from './parseFrontmatter';
import type { MarkdownPreviewProps } from './types';

export type { MarkdownPreviewProps } from './types';

/**
 * 可复用 Markdown 文档预览（GFM + 轻量语法高亮；自动抽离 frontmatter）
 */
function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ');
  const { matter, body } = parseFrontmatter(source);

  return (
    <div className={rootClassName}>
      {matter ? <FrontmatterStrip matter={matter} /> : null}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
```

- [x] **Step 2: 类型检查 + 单测 + build**

```powershell
cd D:\myComponent\WorkBench
yarn test src/components/MarkdownPreview/parseFrontmatter.test.ts
yarn build
```

Expected: 测试 PASS；`tsc -b && vite build` 成功。

- [x] **Step 3: 手工验收清单**

1. 工作台打开带 frontmatter 的 Skill（如 `.cursor/skills/**/SKILL.md`）：顶部「元数据」条 + 正文无 `---` 块  
2. 常用字段按序；`extra` 类键在「更多」  
3. 切「原文」：完整源文件含 `---`  
4. 打开无 frontmatter 的 md：无信息条，观感与改前一致  
5. （可选）临时构造坏 YAML 文件：不抽离、整份当 MD  

- [x] **Step 4: Commit（跳过）**

---

### Task 6: 同步 design / plan 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-workbench-frontmatter-strip-design.md`
- Modify: `docs/superpowers/specs/2026-08-06-workbench-markdown-preview-design.md`（后续项一句）
- Modify: 本 plan 文件勾选状态（实现过程中维护）

- [x] **Step 1: 更新 frontmatter strip spec**

- 将文首 `状态：设计中` 改为 `状态：已实现`
- 修订记录追加一行：实现完成日期与冒烟结果（`yarn test` + `yarn build`）

- [x] **Step 2: 回写 markdown-preview spec 后续项**

在 `2026-08-06-workbench-markdown-preview-design.md` 的「后续」中，将 frontmatter 相关条目改为已由 `2026-08-06-workbench-frontmatter-strip-design.md` 承接/实现（一句即可，勿大段重写）。

- [x] **Step 3: Commit（跳过）**

---

## Self-Review（对照 spec）

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 合法 frontmatter 抽离 + 信息条 | Task 3–5 |
| 常用五字段顺序 | Task 4 `FEATURED_KEYS` |
| 「更多」默认折叠；仅更多时默认展开 | Task 4 `onlyExtras` / `useState` |
| 失败降级整份 MD | Task 2–3 |
| 原文模式不抽离 | 不改 PreviewPane（File Structure） |
| API 仍 `source` | Task 5 |
| `parseFrontmatter` 单测 | Task 2–3 |
| `js-yaml` | Task 1 |
| 轻量条视觉（左强调线、mono 键） | Task 4 less |
| sync design | Task 6 |

无 TBD/占位；类型名 `ParseFrontmatterResult` / `matter` / `body` 前后一致。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-06-workbench-frontmatter-strip.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 每个 Task 派一个新子代理，Task 间人工复核，迭代快  

**2. Inline Execution** — 本会话按 `executing-plans` 连续执行，设检查点  

Which approach?
