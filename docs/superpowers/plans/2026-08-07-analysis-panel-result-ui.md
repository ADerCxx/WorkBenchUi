# 分析工具默认尺寸与左栏结果 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将分析浮窗默认尺寸改为 1180×760，左栏改为「头图 + 状态副标题 + 浅灰卡片」，并把分析按钮从标题栏挪到左栏头图右侧（一键分析 / 重新分析）。

**Architecture:** 纯 UI/几何调整，落在 `AnalysisPanel` 内：`panelGeometry` 改默认常量；抽出 `resultChrome` 纯函数生成副标题与按钮文案便于单测；`index.tsx` 重组左栏 DOM；样式进同级 `index.less`。不改 SSE、`useAnalysisStream`、右栏占位、`MarkdownPreview` 全局样式。

**Tech Stack:** React、antd Icons/Button、Less CSS Modules、Vitest

**Spec:** `docs/superpowers/specs/2026-08-07-analysis-panel-result-ui-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `src/pages/Workbench/components/AnalysisPanel/panelGeometry.ts` | `DEFAULT_PANEL_WIDTH/HEIGHT` → 1180 / 760 |
| `src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts` | 默认几何与夹紧单测 |
| `src/pages/Workbench/components/AnalysisPanel/resultChrome.ts` | 副标题 / 按钮文案纯函数 |
| `src/pages/Workbench/components/AnalysisPanel/resultChrome.test.ts` | 文案单测 |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 标题栏去分析钮；左栏头图+按钮+卡片 |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 头图、副标题、结果卡片样式 |
| `docs/superpowers/specs/2026-08-07-analysis-panel-result-ui-design.md` | 收尾改状态为已实现 |
| `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md` | 同步默认尺寸表述 |
| `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md` | 同步按钮位置表述（若仍写在标题栏） |

---

### Task 1: 默认几何 1180×760 + 单测

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/panelGeometry.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts`

- [x] **Step 1: 写失败单测**

创建 `panelGeometry.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PANEL_HEIGHT,
  DEFAULT_PANEL_WIDTH,
  getDefaultPanelBounds,
} from './panelGeometry';

describe('panelGeometry defaults', () => {
  it('uses 1180×760 as default size constants', () => {
    expect(DEFAULT_PANEL_WIDTH).toBe(1180);
    expect(DEFAULT_PANEL_HEIGHT).toBe(760);
  });

  it('centers default bounds inside a large viewport', () => {
    const bounds = getDefaultPanelBounds(1600, 1000);
    expect(bounds.width).toBe(1180);
    expect(bounds.height).toBe(760);
    expect(bounds.x).toBe(Math.round((1600 - 1180) / 2));
    expect(bounds.y).toBe(Math.round((1000 - 760) / 3));
  });

  it('clamps to viewport - 32 on small screens', () => {
    const bounds = getDefaultPanelBounds(900, 600);
    expect(bounds.width).toBe(900 - 32);
    expect(bounds.height).toBe(600 - 32);
  });
});
```

- [x] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts
```

Expected: FAIL（常量仍为 960 / 640，或尚未匹配断言）

- [x] **Step 3: 改常量**

在 `panelGeometry.ts` 将：

```ts
export const DEFAULT_PANEL_WIDTH = 960;
export const DEFAULT_PANEL_HEIGHT = 640;
```

改为：

```ts
export const DEFAULT_PANEL_WIDTH = 1180;
export const DEFAULT_PANEL_HEIGHT = 760;
```

`getDefaultPanelBounds` / `isPanelTooSmall` / `MIN_COMFORT_*` 不动。

- [x] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit（跳过，除非用户要求）**

---

### Task 2: `resultChrome` 纯函数 + 单测

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/resultChrome.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/resultChrome.test.ts`

- [x] **Step 1: 写失败单测**

创建 `resultChrome.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import {
  getAnalyzeButtonLabel,
  getResultSubtitle,
} from './resultChrome';

describe('getResultSubtitle', () => {
  it('idle empty', () => {
    expect(getResultSubtitle('idle', false)).toBe(
      '点击一键分析，查看 AI 结果',
    );
  });

  it('running', () => {
    expect(getResultSubtitle('running', false)).toBe(
      '正在根据当前文件生成解读与建议…',
    );
    expect(getResultSubtitle('running', true)).toBe(
      '正在根据当前文件生成解读与建议…',
    );
  });

  it('idle with markdown', () => {
    expect(getResultSubtitle('idle', true)).toBe(
      '已根据当前文件内容生成本次解读与建议。',
    );
  });

  it('error', () => {
    expect(getResultSubtitle('error', false)).toBe(
      '分析中断或失败，可修改后重新分析',
    );
    expect(getResultSubtitle('error', true)).toBe(
      '分析中断或失败，可修改后重新分析',
    );
  });
});

describe('getAnalyzeButtonLabel', () => {
  it('一键分析 when idle and empty', () => {
    expect(getAnalyzeButtonLabel('idle', false)).toBe('一键分析');
  });

  it('重新分析 when has markdown or running', () => {
    expect(getAnalyzeButtonLabel('idle', true)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('running', false)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('running', true)).toBe('重新分析');
    expect(getAnalyzeButtonLabel('error', true)).toBe('重新分析');
  });

  it('一键分析 when error and empty', () => {
    expect(getAnalyzeButtonLabel('error', false)).toBe('一键分析');
  });
});
```

- [x] **Step 2: 跑测确认失败**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/resultChrome.test.ts
```

Expected: FAIL（模块不存在）

- [x] **Step 3: 实现纯函数**

创建 `resultChrome.ts`：

```ts
import type { AnalysisStreamStatus } from '@/hooks/useAnalysisStream';

export function getResultSubtitle(
  status: AnalysisStreamStatus,
  hasMarkdown: boolean,
): string {
  if (status === 'running') {
    return '正在根据当前文件生成解读与建议…';
  }
  if (status === 'error') {
    return '分析中断或失败，可修改后重新分析';
  }
  if (hasMarkdown) {
    return '已根据当前文件内容生成本次解读与建议。';
  }
  return '点击一键分析，查看 AI 结果';
}

export function getAnalyzeButtonLabel(
  status: AnalysisStreamStatus,
  hasMarkdown: boolean,
): string {
  if (status === 'running' || hasMarkdown) {
    return '重新分析';
  }
  return '一键分析';
}
```

- [x] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/resultChrome.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit（跳过，除非用户要求）**

---

### Task 3: 左栏样式（index.less）

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.less`

- [x] **Step 1: 增加左栏头图与卡片样式**

在现有 `index.less` 中追加/调整（保留 `.panel` / `.header` / `.chip` / `.tooSmall` 等；左栏相关替换或增强）：

```less
.pane {
  flex: 1;
  min-width: 0;
  padding: 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resultHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.resultBrand {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.resultIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  flex-shrink: 0;
}

.resultTitleBlock {
  min-width: 0;
}

.resultTitle {
  margin: 0;
  font-family: var(--heading);
  font-weight: 700;
  font-size: 16px;
  color: var(--text-h);
  line-height: 1.3;
}

.resultSubtitle {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text);
}

.resultActions {
  flex-shrink: 0;
}

.resultCard {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--border) 45%, #f5f6f8);
}

.result {
  min-height: 100%;
}

.empty {
  color: var(--text);
  opacity: 0.75;
  font-size: 13px;
}

.errorBar {
  margin-bottom: 0;
  padding: 8px 10px;
  border: 1px solid #ffccc7;
  background: #fff2f0;
  color: #a8071a;
  font-size: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}
```

说明：右栏 `.pane` 同样会拿到 flex column；其内仅有 `.placeholder` 时可接受。若右栏视觉异常，给左栏加修饰类 `.paneResult` 并把上述 flex/gap 仅挂在 `.paneResult` 上。

- [x] **Step 2: 目视确认 class 名与 Task 4 JSX 一致（无需跑测）**

- [ ] **Step 3: Commit（跳过，除非用户要求）**

---

### Task 4: AnalysisPanel JSX 重组

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.tsx`

- [x] **Step 1: 更新 import**

增加：

```ts
import { ThunderboltOutlined, /* 既有 CloseOutlined, ExpandOutlined, LoadingOutlined, MinusOutlined */ } from '@ant-design/icons';
import {
  getAnalyzeButtonLabel,
  getResultSubtitle,
} from './resultChrome';
```

- [x] **Step 2: 标题栏 toolbar 去掉分析按钮**

`toolbar` 仅保留最小化 / 全屏或退出全屏 / 关闭（`Space` + 三个 `Button`，逻辑不变）。

- [x] **Step 3: 重组左栏 body**

用以下结构替换左栏 `.pane` 内容（右栏与 `tooSmall` 不变）：

```tsx
const hasMarkdown = Boolean(markdown);
const subtitle = getResultSubtitle(status, hasMarkdown);
const analyzeLabel = getAnalyzeButtonLabel(status, hasMarkdown);

// 左栏：
<div className={`${styles.pane} ${styles.paneResult}`}>
  <div className={styles.resultHeader}>
    <div className={styles.resultBrand}>
      <span className={styles.resultIcon} aria-hidden>
        <ThunderboltOutlined />
      </span>
      <div className={styles.resultTitleBlock}>
        <h2 className={styles.resultTitle}>AI 分析结果</h2>
        <p className={styles.resultSubtitle}>{subtitle}</p>
      </div>
    </div>
    <div
      className={styles.resultActions}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Button
        size="small"
        type="primary"
        icon={status === 'running' ? <LoadingOutlined /> : undefined}
        onClick={handleAnalyze}
      >
        {analyzeLabel}
      </Button>
    </div>
  </div>
  {errorMessage ? (
    <div className={styles.errorBar}>{errorMessage}</div>
  ) : null}
  <div className={styles.resultCard}>
    {markdown ? (
      <MarkdownPreview source={markdown} className={styles.result} />
    ) : (
      <div className={styles.empty}>暂无结果</div>
    )}
  </div>
</div>
```

若 Task 3 选用 `.paneResult` 限定 flex，须在 less 中增加：

```less
.paneResult {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

并把通用 `.pane` 保持为原先的 padding/overflow（可去掉强制 column，避免右栏副作用）。

- [x] **Step 4: 类型检查**

```powershell
yarn build
```

Expected: `tsc -b` 与 vite build 通过（或至少 `tsc -b` 无 AnalysisPanel 相关错误）。若全量 build 过慢，可用：

```powershell
npx tsc -b --pretty false
```

Expected: 退出码 0

- [ ] **Step 5: Commit（跳过，除非用户要求）**

---

### Task 5: 文档同步 + design 收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-analysis-panel-result-ui-design.md`
- Modify: `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md`
- Modify: `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`（若文中仍写标题栏一键分析）
- Modify: 本 plan（勾选 Task、必要时补「已知实现注意点」）

- [x] **Step 1: 本轮 design 改状态**

`2026-08-07-analysis-panel-result-ui-design.md`：`状态：设计中` → `状态：已实现`；修订记录追加一行「Task 收尾：默认 1180×760 与左栏 UI 已落地」。

- [x] **Step 2: 同步浮窗壳 design**

在 `2026-08-05-workbench-analysis-panel-design.md`：

- 「默认几何」由 **960×640** 改为 **1180×760**
- 成功标准/交互中「一键分析」若仍写在标题栏，改为「左栏头图右侧（见 result-ui design）」或删除过时句
- 修订记录追加：`2026-08-07 | 默认尺寸改为 1180×760；分析按钮迁至左栏（见 analysis-panel-result-ui）`

- [x] **Step 3: 同步流式 design**

在 `2026-08-07-workbench-ai-analysis-stream-design.md` 中，凡「标题栏一键分析」改为「左栏头图右侧分析按钮」；修订记录补一行指向本 design。

- [ ] **Step 4: 浏览器冒烟（人工）**

1. 打开分析工具 → 默认约 1180×760；标题栏无「一键分析」
2. 左栏头图 + 副标题空态 +「一键分析」+ 浅灰卡片「暂无结果」
3. 有文件内容点分析 → 副标题「正在…」→ 完成后「已根据…」；按钮「重新分析」；Markdown 在卡片内
4. 进行中再点 → 中断重开；关窗再开为空态

- [ ] **Step 5: Commit（跳过，除非用户要求）**

---

## 已知实现注意点

- 勿给分析按钮加 antd `loading`（会吞掉进行中二次点击）。
- 左栏 `resultActions` 必须 `stopPropagation` onMouseDown。
- 右栏不要误套结果卡片样式；优先用 `.paneResult` 限定左栏布局。
- 不改 `MarkdownPreview` 源码。
- `react-rnd` 根节点用 `.rnd`，内部再包 `.panel`（`width/height: 100%` + column flex），否则 body 无法撑满浮窗高度；左栏 `.paneResult` 需 `min-height: 0` + `overflow: hidden`，滚动交给 `.resultCard`。

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| 默认 1180×760 + 夹紧 | Task 1 |
| 副标题四态文案 | Task 2 |
| 一键 / 重新分析文案 | Task 2 + 4 |
| 标题栏仅三钮 | Task 4 |
| 左栏头图 + 卡片 + Markdown | Task 3 + 4 |
| 流式逻辑不变 | 不改 hook（隐式） |
| 文档同步 | Task 5 |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | Task 5：design 状态改为已实现；同步浮窗壳/流式 design；勾选 Task 1–5 已完成步骤（Commit/浏览器冒烟除外） |
| 2026-08-07 | 修复 body 未撑满：`.rnd` + 内层 `.panel` 高度链；补充已知实现注意点 |
| 2026-08-07 | `AnalysisStreamStatus` 改从 `@/hooks/useAnalysisStream` 导入 |
