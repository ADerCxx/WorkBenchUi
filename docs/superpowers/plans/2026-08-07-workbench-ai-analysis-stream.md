# 工作台 AI 分析结果流式呈现 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在分析工具浮窗左栏对接 `POST /qoderSessions/conversation` SSE，一键分析当前选中文件并以 `MarkdownPreview` 实时呈现分析结果。

**Architecture:** `Workbench` 只传入 `fileName` / `fileContent`；`AnalysisPanel` 内用 `useAnalysisStream` 管理 Abort、cancel 与 markdown 缓冲；`src/apis/qoderSessions/conversation` 用 `@microsoft/fetch-event-source`（流式例外），`cancel` 走现有 `request`；忽略 `renderCode`，右栏保持占位。

**Tech Stack:** React 19、antd 6、`@microsoft/fetch-event-source`、`MarkdownPreview`（react-markdown）、Less CSS Modules、Vitest、现有 `@/utils/request` + `ApiUrl`

**Spec:** `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加 `@microsoft/fetch-event-source` |
| `src/apis/qoderSessions/conversation/types.ts` | 入参、`SseResponse`、流式回调类型 |
| `src/apis/qoderSessions/conversation/parseSseData.ts` | SSE `data` 字符串 → `SseResponse`（可单测） |
| `src/apis/qoderSessions/conversation/parseSseData.test.ts` | 解析单测 |
| `src/apis/qoderSessions/conversation/index.ts` | `QoderSessionsConversationApi`（fetch-event-source） |
| `src/apis/qoderSessions/cancel/index.ts` | `QoderSessionsCancelApi`（标准 request） |
| `src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.ts` | path → basename（可单测） |
| `src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.test.ts` | basename 单测 |
| `src/pages/Workbench/components/AnalysisPanel/useAnalysisStream.ts` | 流式状态机 + Abort/cancel 编排 |
| `src/pages/Workbench/components/AnalysisPanel/types.ts` | 增 `fileName` / `fileContent` props |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 一键分析真实触发；左栏 MarkdownPreview |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 结果区 / 空态 / 错误条样式 |
| `src/pages/Workbench/index.tsx` | 向面板传入 fileName / fileContent |
| `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md` | 收尾改状态为已实现 |

---

### Task 1: 安装 `@microsoft/fetch-event-source`

**Files:**
- Modify: `package.json`（由包管理器写入）

- [ ] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
yarn add @microsoft/fetch-event-source
```

Expected: `dependencies` 出现 `@microsoft/fetch-event-source`，安装无报错。

- [ ] **Step 2: 确认可解析**

```powershell
yarn why @microsoft/fetch-event-source
```

Expected: 显示已安装版本信息。

---

### Task 2: SSE 解析纯函数 + 单测

**Files:**
- Create: `src/apis/qoderSessions/conversation/types.ts`
- Create: `src/apis/qoderSessions/conversation/parseSseData.ts`
- Create: `src/apis/qoderSessions/conversation/parseSseData.test.ts`

- [ ] **Step 1: 写失败单测**

创建 `parseSseData.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { parseSseData } from './parseSseData';

describe('parseSseData', () => {
  it('parses valid JSON into SseResponse', () => {
    const raw = JSON.stringify({
      sessionId: 's1',
      content: 'hello',
      renderCode: 'graph',
      eventId: 'e1',
      status: 'RUNNING',
    });
    expect(parseSseData(raw)).toEqual({
      sessionId: 's1',
      content: 'hello',
      renderCode: 'graph',
      eventId: 'e1',
      status: 'RUNNING',
    });
  });

  it('returns null for empty data', () => {
    expect(parseSseData('')).toBeNull();
    expect(parseSseData('   ')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseSseData('{not-json')).toBeNull();
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/apis/qoderSessions/conversation/parseSseData.test.ts
```

Expected: FAIL（模块不存在或 `parseSseData` 未定义）。

- [ ] **Step 3: 写类型与实现**

创建 `types.ts`：

```ts
export type QoderSessionsConversationParams = {
  fileName?: string;
  fileContent: string;
};

export type SseResponse = {
  sessionId?: string;
  content?: string;
  renderCode?: string | null;
  eventId?: string;
  /** 后端常见：RUNNING / STOP */
  status?: string;
};

export type ConversationStreamHandlers = {
  onSession?: (sessionId: string) => void;
  onDelta?: (content: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
};
```

创建 `parseSseData.ts`：

```ts
import type { SseResponse } from './types';

/** 将 SSE data 字段解析为 SseResponse；空串或非法 JSON 返回 null */
export function parseSseData(data: string): SseResponse | null {
  const trimmed = data.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as SseResponse;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/apis/qoderSessions/conversation/parseSseData.test.ts
```

Expected: PASS。

---

### Task 3: Cancel API（标准 request）

**Files:**
- Create: `src/apis/qoderSessions/cancel/index.ts`

- [ ] **Step 1: 实现 `QoderSessionsCancelApi`**

```ts
import {
  HttpStatus,
  getBizMessage,
  type ResponseStructure,
} from '@/apis/types';
import request from '@/utils/request';

/**
 * 取消当前 Turn
 * POST /qoderSessions/{id}/cancel
 */
export async function QoderSessionsCancelApi(id: string): Promise<boolean> {
  try {
    const res = await request<ResponseStructure<boolean>>({
      url: `/qoderSessions/${id}/cancel`,
      method: 'POST',
      params: {},
    });

    if (res.data.code === HttpStatus.Success) {
      return res.data.data;
    }

    return Promise.reject(new Error(getBizMessage(res.data)));
  } catch (err) {
    if (err instanceof Error && err.message !== '网络异常') {
      return Promise.reject(err);
    }
    return Promise.reject(new Error('网络异常'));
  }
}
```

说明：若 `catch` 里已是业务 `reject` 抛出的 Error，应原样 rethrow；上例可简化为与 `RegexRulesDeleteApi` 完全同构的 `catch { return Promise.reject(new Error('网络异常')) }`——**以仓库现有 delete API 模板为准**，复制其 try/catch 形态即可：

```ts
export async function QoderSessionsCancelApi(id: string): Promise<boolean> {
  try {
    const res = await request<ResponseStructure<boolean>>({
      url: `/qoderSessions/${id}/cancel`,
      method: 'POST',
      params: {},
    });

    if (res.data.code === HttpStatus.Success) {
      return res.data.data;
    }

    return Promise.reject(new Error(getBizMessage(res.data)));
  } catch {
    return Promise.reject(new Error('网络异常'));
  }
}
```

- [ ] **Step 2: Typecheck 该文件无新增错误**

```powershell
yarn exec tsc -b --pretty false 2>&1 | Select-String qoderSessions
```

Expected: 无 `qoderSessions` 相关报错（若全量工程另有既有错误可忽略无关项）。

---

### Task 4: Conversation 流式 API

**Files:**
- Create: `src/apis/qoderSessions/conversation/index.ts`

- [ ] **Step 1: 实现 `QoderSessionsConversationApi`**

```ts
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ApiUrl } from '@/config';

import { parseSseData } from './parseSseData';
import type {
  ConversationStreamHandlers,
  QoderSessionsConversationParams,
} from './types';

/**
 * 文件分析对话（SSE）
 * POST /qoderSessions/conversation
 * 流式例外：不用 @/utils/request；不包 ResponseStructure
 */
export async function QoderSessionsConversationApi(
  params: QoderSessionsConversationParams,
  handlers: ConversationStreamHandlers = {},
): Promise<void> {
  const { onSession, onDelta, onDone, onError, signal } = handlers;
  const url = `${ApiUrl}/qoderSessions/conversation`;

  try {
    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: params.fileName,
        fileContent: params.fileContent,
      }),
      signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          return;
        }
        const text = await response.text().catch(() => '');
        throw new Error(text || `分析请求失败（${response.status}）`);
      },
      onmessage(ev) {
        if (!ev.data) {
          return;
        }
        const parsed = parseSseData(ev.data);
        if (!parsed) {
          console.warn('[qoderSessions/conversation] skip bad SSE frame', ev.data);
          return;
        }
        if (parsed.sessionId) {
          onSession?.(parsed.sessionId);
        }
        if (parsed.content) {
          onDelta?.(parsed.content);
        }
        if (parsed.status === 'STOP') {
          onDone?.();
        }
      },
      onerror(err) {
        // 抛出以停止库默认重试
        throw err;
      },
    });
  } catch (err) {
    if (signal?.aborted) {
      return;
    }
    const error =
      err instanceof Error ? err : new Error('分析流异常');
    onError?.(error);
    throw error;
  }
}
```

注意：`fetchEventSource` 在正常结束时 resolve；用户 Abort 时通常抛 `AbortError`——上面 `signal?.aborted` 分支吞掉，不调用 `onError`。若库行为是 Abort 不进 catch，也保持幂等。

- [ ] **Step 2: 确认导出可被 TS 解析**

```powershell
yarn exec tsc -b --pretty false 2>&1 | Select-String "qoderSessions/conversation"
```

Expected: 无该路径报错。

---

### Task 5: `fileNameFromPath` + 单测

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.test.ts`

- [ ] **Step 1: 写失败单测**

```ts
import { describe, expect, it } from 'vitest';
import { fileNameFromPath } from './fileNameFromPath';

describe('fileNameFromPath', () => {
  it('returns basename for posix path', () => {
    expect(fileNameFromPath('docs/a/SKILL.md')).toBe('SKILL.md');
  });

  it('normalizes backslash', () => {
    expect(fileNameFromPath('docs\\a\\SKILL.md')).toBe('SKILL.md');
  });

  it('defaults when null or empty', () => {
    expect(fileNameFromPath(null)).toBe('context.txt');
    expect(fileNameFromPath('')).toBe('context.txt');
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现**

```ts
/** 从工作台选中 path 取文件名；空则默认 context.txt（对齐后端） */
export function fileNameFromPath(path: string | null | undefined): string {
  if (!path) {
    return 'context.txt';
  }
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'context.txt';
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.test.ts
```

Expected: PASS。

---

### Task 6: `useAnalysisStream` hook

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/useAnalysisStream.ts`

- [ ] **Step 1: 实现 hook**

```ts
import { QoderSessionsCancelApi } from '@/apis/qoderSessions/cancel';
import { QoderSessionsConversationApi } from '@/apis/qoderSessions/conversation';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AnalysisStreamStatus = 'idle' | 'running' | 'error';

export type UseAnalysisStreamResult = {
  status: AnalysisStreamStatus;
  markdown: string;
  sessionId: string | null;
  errorMessage: string | null;
  start: (input: { fileName: string; fileContent: string }) => Promise<void>;
  abortAndCancel: () => Promise<void>;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

export function useAnalysisStream(): UseAnalysisStreamResult {
  const [status, setStatus] = useState<AnalysisStreamStatus>('idle');
  const [markdown, setMarkdown] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const abortAndCancel = useCallback(async () => {
    runIdRef.current++;
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();

    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    setSessionId(null);
    setStatus('idle');

    if (id) {
      void QoderSessionsCancelApi(id).catch(() => undefined);
    }
  }, []);

  const start = useCallback(
    async (input: { fileName: string; fileContent: string }) => {
      await abortAndCancel();

      const runId = ++runIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      setMarkdown('');
      setErrorMessage(null);
      setSessionId(null);
      sessionIdRef.current = null;
      setStatus('running');

      try {
        await QoderSessionsConversationApi(
          {
            fileName: input.fileName,
            fileContent: input.fileContent,
          },
          {
            signal: controller.signal,
            onSession: (id) => {
              if (runId !== runIdRef.current) return;
              sessionIdRef.current = id;
              setSessionId(id);
            },
            onDelta: (chunk) => {
              if (runId !== runIdRef.current) return;
              setMarkdown((prev) => prev + chunk);
            },
            onDone: () => {
              if (runId !== runIdRef.current) return;
              setStatus('idle');
            },
            onError: (err) => {
              if (runId !== runIdRef.current) return;
              if (isAbortError(err) || controller.signal.aborted) return;
              setErrorMessage(err.message || '分析失败');
              setStatus('error');
            },
          },
        );

        if (runId === runIdRef.current && !controller.signal.aborted) {
          setStatus((prev) => (prev === 'error' ? prev : 'idle'));
        }
      } catch (err) {
        if (runId !== runIdRef.current) return;
        if (isAbortError(err) || controller.signal.aborted) {
          setStatus('idle');
          return;
        }
        const msg = err instanceof Error ? err.message : '分析失败';
        setErrorMessage(msg);
        setStatus('error');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [abortAndCancel],
  );

  useEffect(() => {
    return () => {
      runIdRef.current++;
      const controller = abortRef.current;
      abortRef.current = null;
      controller?.abort();
      const id = sessionIdRef.current;
      sessionIdRef.current = null;
      if (id) {
        void QoderSessionsCancelApi(id).catch(() => undefined);
      }
    };
  }, []);

  return {
    status,
    markdown,
    sessionId,
    errorMessage,
    start,
    abortAndCancel,
  };
}
```

- [ ] **Step 2: Typecheck**

```powershell
yarn exec tsc -b --pretty false 2>&1 | Select-String useAnalysisStream
```

Expected: 无报错。

**已知实现注意点：**
- `abortAndCancel` 入口先 `runIdRef.current++`，Abort/清状态同步完成；cancel 为 fire-and-forget（不 await），关窗可立即 `onClose`。
- 卸载 cleanup 同样 `runId++` + Abort + best-effort cancel，防陈旧 `setState`。

---

### Task 7: 更新 `AnalysisPanel` 类型与样式

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/types.ts`
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.less`

- [ ] **Step 1: 扩展 props**

将 `types.ts` 替换为：

```ts
export type AnalysisPanelMode = 'normal' | 'minimized' | 'fullscreen';

export type AnalysisPanelProps = {
  mode: AnalysisPanelMode;
  onModeChange: (mode: AnalysisPanelMode) => void;
  onClose: () => void;
  /** 当前选中文件名（basename）；可为空串，分析前由面板校验内容 */
  fileName: string;
  /** 当前选中文件全文；空则不可发起分析 */
  fileContent: string;
};
```

- [ ] **Step 2: 补充结果区样式**

在 `index.less` 末尾追加（保留既有规则）：

```less
.result {
  min-height: 100%;
}

.empty {
  color: var(--text-secondary, #888);
  font-size: 13px;
}

.errorBar {
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid #ffccc7;
  background: #fff2f0;
  color: #a8071a;
  font-size: 12px;
  border-radius: 4px;
}
```

实现时遵守 `.cursor/skills/css-module-less/SKILL.md`：类名进 CSS Modules，不用内联 style 堆布局。

---

### Task 8: 接线 `AnalysisPanel` UI

**Files:**
- Modify: `src/pages/Workbench/components/AnalysisPanel/index.tsx`

- [ ] **Step 1: 替换组件实现要点**

关键改动（在现有壳逻辑上增量，勿推翻拖拽/全屏）：

1. props 解构增加 `fileName`、`fileContent`
2. `const stream = useAnalysisStream()`
3. `handleAnalyze`：

```ts
const handleAnalyze = useCallback(() => {
  if (!fileContent.trim()) {
    message.warning('当前文件无内容可分析');
    return;
  }
  void stream.start({
    fileName: fileName || 'context.txt',
    fileContent,
  });
}, [fileContent, fileName, stream]);
```

4. 关闭：

```ts
const handleClose = useCallback(() => {
  void stream.abortAndCancel().finally(() => {
    onClose();
  });
}, [onClose, stream]);
```

标题栏关闭按钮与全屏/普通态两处 `onClick={onClose}` 改为 `onClick={handleClose}`。

5. 一键分析按钮：`icon={status === 'running' ? <LoadingOutlined /> : undefined}`（勿用 antd `loading`，会拦截 onClick；仍可点击以中断重开）。

6. 左栏由占位改为：

```tsx
<div className={styles.pane}>
  {stream.errorMessage ? (
    <div className={styles.errorBar}>{stream.errorMessage}</div>
  ) : null}
  {stream.markdown ? (
    <MarkdownPreview source={stream.markdown} className={styles.result} />
  ) : (
    <div className={styles.empty}>点击一键分析，查看 AI 结果</div>
  )}
</div>
```

右栏占位文案保持「关系图谱（占位）」。

7. import：

```ts
import MarkdownPreview from '@/components/MarkdownPreview';
import { useAnalysisStream } from './useAnalysisStream';
```

完整文件应保留 `Rnd`、最小化胶囊、`panelGeometry`、过小提示等现有行为；仅替换分析与左栏。

- [ ] **Step 2: 本地确认无 TSX 类型错误（AnalysisPanel）**

```powershell
yarn exec tsc -b --pretty false 2>&1 | Select-String AnalysisPanel
```

Expected: 因 `Workbench` 尚未传新 props，可能报缺少 `fileName`/`fileContent`——进入 Task 9 修复。

---

### Task 9: `Workbench` 传入文件 props

**Files:**
- Modify: `src/pages/Workbench/index.tsx`

- [ ] **Step 1: 计算并传入**

在 `selectedContent` 附近增加：

```ts
import { fileNameFromPath } from './components/AnalysisPanel/fileNameFromPath';

// ...

const analysisFileName = fileNameFromPath(selectedPath);
const analysisFileContent = selectedContent ?? '';
```

挂载处改为：

```tsx
{analysisMode !== null ? (
  <AnalysisPanel
    mode={analysisMode}
    onModeChange={setAnalysisMode}
    onClose={handleCloseAnalysis}
    fileName={analysisFileName}
    fileContent={analysisFileContent}
  />
) : null}
```

- [ ] **Step 2: 全量相关单测 + tsc**

```powershell
yarn test src/apis/qoderSessions/conversation/parseSseData.test.ts src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.test.ts
yarn exec tsc -b --pretty false 2>&1 | Select-String "AnalysisPanel|qoderSessions|useAnalysisStream"
```

Expected: 测试 PASS；上述路径无新增 TS 错误。

---

### Task 10: 浏览器冒烟 + 文档收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-workbench-ai-analysis-stream-design.md`（状态 → 已实现）
- 若实现与 design 有偏差：按 `.cursor/skills/sync-design-plan/SKILL.md` + `.cursor/rules/sync-design-plan.mdc` 回写 design/plan

- [ ] **Step 1: 手动冒烟清单**

1. 选中有内容文件 → 开分析工具 → 一键分析 → Network 出现 `conversation` SSE → 左栏 Markdown 增长 → STOP 后稳定  
2. 空内容（或清空选中导致 content 空）→ warning，无请求  
3. 进行中再点一键分析 → 旧连接中断，可见 cancel（若已有 sessionId），左栏清空后重流  
4. 进行中关窗 → 再开为空态「点击一键分析，查看 AI 结果」  
5. 最小化不中断；还原可见已生成内容  
6. 右栏仍为「关系图谱（占位）」

- [ ] **Step 2: 更新 design 状态**

将 spec 头部 `状态：设计中` 改为 `状态：已实现`，修订记录追加一行「Task 收尾：左栏 SSE 流式呈现已实现」。

- [ ] **Step 3: 跳过 git commit**（除非用户明确要求提交）

---

## Spec coverage（自检）

| Spec 要求 | Task |
|-----------|------|
| 左栏 SSE + MarkdownPreview 实时渲染 | 4, 6, 8 |
| 忽略 renderCode / 右栏占位 | 4（不调用）、8 |
| 重分析 Abort + cancel + 清空 | 6, 8 |
| 关窗中断清空 | 6, 8 |
| apis 封装；cancel 走 request | 3, 4 |
| fetch-event-source | 1, 4 |
| 空内容 warning | 8 |
| fileName basename + fileContent | 5, 9 |
| 空态文案 | 8 |
| 最小化不中断 | 6（不在 minimize 调 abort） |
| JSON 坏帧跳过 | 2, 4 |
| design 状态收尾 | 10 |

---

## 执行交接

Plan complete and saved to `docs/superpowers/plans/2026-08-07-workbench-ai-analysis-stream.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 每任务派生子代理，任务间复查，迭代快  

**2. Inline Execution** — 本会话用 executing-plans 按任务推进，设检查点  

Which approach?

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-07 | 终审修复：一键分析用 `LoadingOutlined`；`abortAndCancel` 同步 Abort + cancel 非阻塞并入口递增 runId |
