# 工作台分析工具浮窗壳 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/workbench` 顶栏加入「分析工具」入口，打开可拖拽/缩放的浮窗壳（最小化胶囊、全屏、关闭重置、一键分析占位），左右栏仅占位。

**Architecture:** `Workbench` 用 `analysisMode: null | 'normal' | 'minimized' | 'fullscreen'` 编排；`WorkbenchHeader` 按 `selectedPath` 禁用入口；新建 `AnalysisPanel`（`react-rnd`）自管普通态几何与过小提示；关闭时父级置 `null` 卸载以重置。

**Tech Stack:** React 19、antd 6（Button/Space/Typography/message）、`react-rnd`、Less CSS Modules、Vitest（纯函数单测）

**Spec:** `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `package.json` | 增加依赖 `react-rnd` |
| `src/pages/Workbench/components/AnalysisPanel/panelGeometry.ts` | 默认几何、过小判定纯函数 |
| `src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts` | 几何纯函数单测 |
| `src/pages/Workbench/components/AnalysisPanel/types.ts` | `AnalysisPanelMode`、`AnalysisPanelProps` |
| `src/pages/Workbench/components/AnalysisPanel/index.less` | 浮窗 / 胶囊 / 双栏占位样式 |
| `src/pages/Workbench/components/AnalysisPanel/index.tsx` | 浮窗壳：拖拽缩放、最小/全屏/关、一键分析占位 |
| `src/pages/Workbench/components/WorkbenchHeader/types.ts` | 增分析入口 props |
| `src/pages/Workbench/components/WorkbenchHeader/index.tsx` | 增「分析工具」按钮 |
| `src/pages/Workbench/index.tsx` | 编排 `analysisMode` 并挂载 `AnalysisPanel` |
| `docs/superpowers/specs/2026-08-05-workbench-analysis-panel-design.md` | 收尾改状态为已实现 |

---

### Task 1: 安装 `react-rnd`

**Files:**
- Modify: `package.json`（由包管理器写入）

- [ ] **Step 1: 安装依赖**

```powershell
cd D:\myComponent\WorkBench
yarn add react-rnd
```

Expected: `dependencies` 出现 `react-rnd`，安装无报错。若 TypeScript 报缺少类型，再执行 `yarn add -D @types/react-rnd`（多数版本已自带类型则可跳过）。

- [ ] **Step 2: 确认可解析**

```powershell
yarn why react-rnd
```

Expected: 显示已安装版本信息。

---

### Task 2: 面板几何纯函数 + 单测

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/panelGeometry.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts`

- [ ] **Step 1: 写失败单测**

创建 `panelGeometry.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PANEL_HEIGHT,
  DEFAULT_PANEL_WIDTH,
  MIN_COMFORT_HEIGHT,
  MIN_COMFORT_WIDTH,
  getDefaultPanelBounds,
  isPanelTooSmall,
} from './panelGeometry';

describe('isPanelTooSmall', () => {
  it('returns true when width below comfort', () => {
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH - 1, MIN_COMFORT_HEIGHT)).toBe(
      true,
    );
  });

  it('returns true when height below comfort', () => {
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH, MIN_COMFORT_HEIGHT - 1)).toBe(
      true,
    );
  });

  it('returns false at comfort threshold', () => {
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH, MIN_COMFORT_HEIGHT)).toBe(false);
  });
});

describe('getDefaultPanelBounds', () => {
  it('centers default size within viewport', () => {
    const bounds = getDefaultPanelBounds(1920, 1080);
    expect(bounds.width).toBe(DEFAULT_PANEL_WIDTH);
    expect(bounds.height).toBe(DEFAULT_PANEL_HEIGHT);
    expect(bounds.x).toBe(Math.round((1920 - DEFAULT_PANEL_WIDTH) / 2));
    expect(bounds.y).toBe(Math.round((1080 - DEFAULT_PANEL_HEIGHT) / 3));
  });

  it('clamps size to viewport when viewport is smaller', () => {
    const bounds = getDefaultPanelBounds(400, 300);
    expect(bounds.width).toBeLessThanOrEqual(400);
    expect(bounds.height).toBeLessThanOrEqual(300);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: 跑测确认失败**

```powershell
cd D:\myComponent\WorkBench
yarn test src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts
```

Expected: FAIL（模块不存在或导出缺失）。

- [ ] **Step 3: 实现纯函数**

创建 `panelGeometry.ts`：

```ts
export const DEFAULT_PANEL_WIDTH = 720;
export const DEFAULT_PANEL_HEIGHT = 480;
export const MIN_COMFORT_WIDTH = 480;
export const MIN_COMFORT_HEIGHT = 320;

export type PanelBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isPanelTooSmall(width: number, height: number): boolean {
  return width < MIN_COMFORT_WIDTH || height < MIN_COMFORT_HEIGHT;
}

/** 默认几何：水平居中，垂直约 1/3 处；不超过视口 */
export function getDefaultPanelBounds(
  viewportWidth: number,
  viewportHeight: number,
): PanelBounds {
  const width = Math.min(DEFAULT_PANEL_WIDTH, Math.max(280, viewportWidth - 32));
  const height = Math.min(
    DEFAULT_PANEL_HEIGHT,
    Math.max(200, viewportHeight - 32),
  );
  const x = Math.max(0, Math.round((viewportWidth - width) / 2));
  const y = Math.max(0, Math.round((viewportHeight - height) / 3));
  return { x, y, width, height };
}
```

- [ ] **Step 4: 跑测确认通过**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts
```

Expected: PASS（全部用例绿）。

---

### Task 3: 扩展 `WorkbenchHeader` 分析入口

**Files:**
- Modify: `src/pages/Workbench/components/WorkbenchHeader/types.ts`
- Modify: `src/pages/Workbench/components/WorkbenchHeader/index.tsx`

- [ ] **Step 1: 扩展 props 类型**

将 `types.ts` 改为：

```ts
export type WorkbenchHeaderProps = {
  rootName: string | null;
  loading: boolean;
  onPickFolder: () => void;
  /** 无选中文件时为 true，禁用「分析工具」 */
  analysisDisabled: boolean;
  onOpenAnalysis: () => void;
};
```

- [ ] **Step 2: 渲染按钮（选文件夹在左，分析工具在右）**

将 `index.tsx` 改为：

```tsx
import { ExperimentOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { WorkbenchHeaderProps } from './types';

export type { WorkbenchHeaderProps } from './types';

/**
 * 工作台顶栏：标题 + 选择文件夹 + 分析工具
 */
function WorkbenchHeader({
  rootName,
  loading,
  onPickFolder,
  analysisDisabled,
  onOpenAnalysis,
}: WorkbenchHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Space size="middle" align="center">
        <Space size={8} align="center">
          <img
            src={`${import.meta.env.BASE_URL}fabricIcon.png`}
            alt=""
            style={{ display: 'block', height: 28, width: 'auto' }}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            知识织物工作台
          </Typography.Title>
        </Space>
        {rootName ? (
          <Typography.Text type="secondary">{rootName}</Typography.Text>
        ) : null}
      </Space>
      <Space>
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          loading={loading}
          onClick={onPickFolder}
        >
          选择文件夹
        </Button>
        <Button
          icon={<ExperimentOutlined />}
          disabled={analysisDisabled}
          onClick={onOpenAnalysis}
        >
          分析工具
        </Button>
      </Space>
    </header>
  );
}

export default WorkbenchHeader;
```

- [ ] **Step 3: 类型检查（此时 Workbench 尚未接线，预期报错）**

先不改 `Workbench`；若本地 `tsc` 会因缺 props 失败，属预期，在 Task 5 一并消除。本步以 Header 文件本身无语法错误为准。

---

### Task 4: 实现 `AnalysisPanel` 浮窗壳

**Files:**
- Create: `src/pages/Workbench/components/AnalysisPanel/types.ts`
- Create: `src/pages/Workbench/components/AnalysisPanel/index.less`
- Create: `src/pages/Workbench/components/AnalysisPanel/index.tsx`

- [ ] **Step 1: 定义类型**

创建 `types.ts`：

```ts
export type AnalysisPanelMode = 'normal' | 'minimized' | 'fullscreen';

export type AnalysisPanelProps = {
  mode: AnalysisPanelMode;
  onModeChange: (mode: AnalysisPanelMode) => void;
  onClose: () => void;
};
```

- [ ] **Step 2: 写样式**

创建 `index.less`：

```less
.panel {
  display: flex;
  flex-direction: column;
  background: var(--bg, #fff);
  color: var(--text, #111);
  border: 1px solid var(--border, #e5e5e5);
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
}

.panelFullscreen {
  position: fixed;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
  z-index: 1000;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border, #e5e5e5);
  cursor: move;
  flex-shrink: 0;
  user-select: none;
}

.headerFullscreen {
  cursor: default;
}

.title {
  font-weight: 600;
  font-size: 14px;
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}

.pane {
  flex: 1;
  min-width: 0;
  padding: 12px;
  overflow: auto;
}

.pane + .pane {
  border-left: 1px solid var(--border, #e5e5e5);
}

.placeholder {
  color: var(--text-secondary, #888);
  font-size: 13px;
}

.tooSmall {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text, #111);
  font-size: 13px;
  z-index: 1;
}

.chip {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border, #e5e5e5);
  background: var(--bg, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 13px;
}
```

- [ ] **Step 3: 实现组件**

创建 `index.tsx`：

```tsx
import {
  CloseOutlined,
  ExpandOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Button, Space, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';
import {
  getDefaultPanelBounds,
  isPanelTooSmall,
  type PanelBounds,
} from './panelGeometry';
import styles from './index.less';
import type { AnalysisPanelProps } from './types';

export type { AnalysisPanelMode, AnalysisPanelProps } from './types';

function readViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * 分析工具浮窗壳：拖拽缩放、最小/全屏/关、左右占位；一键分析仅占位提示
 */
function AnalysisPanel({ mode, onModeChange, onClose }: AnalysisPanelProps) {
  const initialBounds = useMemo(() => {
    const { width, height } = readViewport();
    return getDefaultPanelBounds(width, height);
  }, []);

  const [bounds, setBounds] = useState<PanelBounds>(initialBounds);
  /** 进入全屏前的普通态几何，退出全屏 / 从全屏最小化后还原用 */
  const [normalBounds, setNormalBounds] = useState<PanelBounds>(initialBounds);

  const tooSmall = isPanelTooSmall(bounds.width, bounds.height);

  const handleAnalyze = useCallback(() => {
    message.info('分析能力即将接入');
  }, []);

  const handleMinimize = useCallback(() => {
    if (mode === 'fullscreen') {
      setBounds(normalBounds);
    } else {
      setNormalBounds(bounds);
    }
    onModeChange('minimized');
  }, [bounds, mode, normalBounds, onModeChange]);

  const handleRestore = useCallback(() => {
    setBounds(normalBounds);
    onModeChange('normal');
  }, [normalBounds, onModeChange]);

  const handleEnterFullscreen = useCallback(() => {
    setNormalBounds(bounds);
    onModeChange('fullscreen');
  }, [bounds, onModeChange]);

  const handleExitFullscreen = useCallback(() => {
    setBounds(normalBounds);
    onModeChange('normal');
  }, [normalBounds, onModeChange]);

  if (mode === 'minimized') {
    return (
      <button
        type="button"
        className={styles.chip}
        onClick={handleRestore}
        aria-label="还原分析工具"
      >
        分析工具
      </button>
    );
  }

  const toolbar = (
    <Space size="small" onMouseDown={(e) => e.stopPropagation()}>
      <Button size="small" type="primary" onClick={handleAnalyze}>
        一键分析
      </Button>
      <Button
        size="small"
        icon={<MinusOutlined />}
        onClick={handleMinimize}
        aria-label="最小化"
      />
      {mode === 'fullscreen' ? (
        <Button size="small" onClick={handleExitFullscreen}>
          退出全屏
        </Button>
      ) : (
        <Button
          size="small"
          icon={<ExpandOutlined />}
          onClick={handleEnterFullscreen}
          aria-label="全屏"
        />
      )}
      <Button
        size="small"
        icon={<CloseOutlined />}
        onClick={onClose}
        aria-label="关闭"
      />
    </Space>
  );

  const body = (
    <div className={styles.body}>
      <div className={styles.pane}>
        <div className={styles.placeholder}>AI 分析结果（占位）</div>
      </div>
      <div className={styles.pane}>
        <div className={styles.placeholder}>关系图谱（占位）</div>
      </div>
      {mode === 'normal' && tooSmall ? (
        <div className={styles.tooSmall}>
          尺寸过小，呈现效果不佳，请拉大弹窗
        </div>
      ) : null}
    </div>
  );

  if (mode === 'fullscreen') {
    return (
      <div className={`${styles.panel} ${styles.panelFullscreen}`}>
        <div className={`${styles.header} ${styles.headerFullscreen}`}>
          <span className={styles.title}>分析工具</span>
          {toolbar}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Rnd
      className={styles.panel}
      size={{ width: bounds.width, height: bounds.height }}
      position={{ x: bounds.x, y: bounds.y }}
      minWidth={280}
      minHeight={200}
      bounds="window"
      dragHandleClassName={styles.header}
      onDragStop={(_e, d) => {
        setBounds((prev) => {
          const next = { ...prev, x: d.x, y: d.y };
          setNormalBounds(next);
          return next;
        });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const next = {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y,
        };
        setBounds(next);
        setNormalBounds(next);
      }}
    >
      <div className={styles.header}>
        <span className={styles.title}>分析工具</span>
        {toolbar}
      </div>
      {body}
    </Rnd>
  );
}

export default AnalysisPanel;
```

注意：`Rnd` 的 `className` 若未作用到外层，可将 `styles.panel` 包一层内层 `div`；实现时以实际 DOM 为准微调，但交互与文案不得改。

- [ ] **Step 4: 确认模块可解析**

```powershell
yarn test src/pages/Workbench/components/AnalysisPanel/panelGeometry.test.ts
```

Expected: 仍 PASS；`AnalysisPanel` 暂不强制组件测（vitest 为 node 环境）。

---

### Task 5: 在 `Workbench` 接线

**Files:**
- Modify: `src/pages/Workbench/index.tsx`

- [ ] **Step 1: 引入状态与面板**

在 `index.tsx` 中：

1. 增加 import：

```tsx
import AnalysisPanel from './components/AnalysisPanel';
import type { AnalysisPanelMode } from './components/AnalysisPanel/types';
```

2. 在组件内增加状态与回调：

```tsx
const [analysisMode, setAnalysisMode] = useState<AnalysisPanelMode | null>(
  null,
);

const handleOpenAnalysis = useCallback(() => {
  setAnalysisMode('normal');
}, []);

const handleCloseAnalysis = useCallback(() => {
  setAnalysisMode(null);
}, []);
```

3. 更新 Header：

```tsx
<WorkbenchHeader
  rootName={rootName}
  loading={loading}
  onPickFolder={handlePickFolder}
  analysisDisabled={selectedPath === null}
  onOpenAnalysis={handleOpenAnalysis}
/>
```

4. 在 `styles.page` 根节点内、`styles.body` 之后挂载：

```tsx
{analysisMode !== null ? (
  <AnalysisPanel
    mode={analysisMode}
    onModeChange={setAnalysisMode}
    onClose={handleCloseAnalysis}
  />
) : null}
```

完整 `return` 结构示意：

```tsx
return (
  <div className={styles.page}>
    <WorkbenchHeader
      rootName={rootName}
      loading={loading}
      onPickFolder={handlePickFolder}
      analysisDisabled={selectedPath === null}
      onOpenAnalysis={handleOpenAnalysis}
    />
    <div className={styles.body}>
      <aside className={styles.catalog}>
        <CatalogTree
          hasPicked={hasPicked}
          loading={loading}
          treeData={treeData}
          selectedPath={selectedPath}
          onSelectFile={handleSelectFile}
          emptyDescription={emptyDescription}
        />
      </aside>
      <main className={styles.preview}>
        <RawPreview path={selectedPath} content={selectedContent} />
      </main>
    </div>
    {analysisMode !== null ? (
      <AnalysisPanel
        mode={analysisMode}
        onModeChange={setAnalysisMode}
        onClose={handleCloseAnalysis}
      />
    ) : null}
  </div>
);
```

- [ ] **Step 2: 类型与构建检查**

```powershell
cd D:\myComponent\WorkBench
yarn test
yarn build
```

Expected: 测试通过；`tsc -b && vite build` 成功。

---

### Task 6: 手动验收（对照 spec）

**Files:** 无代码变更（发现问题再回到对应 Task 修）

- [x] **Step 1: 启动开发服** — 本轮以代码级静态验收为主，未常驻 `yarn dev`；交互冒烟留给本机浏览器。

- [x] **Step 2: 按清单点验**（代码静态验收 2026-08-05；标注 NEEDS_BROWSER 项需本机点验）

| # | 操作 | 期望 | 结果 |
|---|------|------|------|
| 1 | 未选文件 | 「分析工具」disabled | PASS |
| 2 | 选文件夹并点选一个文件后点「分析工具」 | 浮窗打开，左右占位可见 | PASS（视觉 NEEDS_BROWSER） |
| 3 | 拖标题栏 / 拉边角 | 可移动可缩放 | PASS（手感 NEEDS_BROWSER） |
| 4 | 缩到宽&lt;480 或高&lt;320 | 出现「尺寸过小，呈现效果不佳，请拉大弹窗」 | PASS（视觉 NEEDS_BROWSER） |
| 5 | 一键分析 | `message.info`「分析能力即将接入」；Network 无分析请求 | PASS |
| 6 | 最小化 | 浮窗消失，右下角胶囊「分析工具」；点击还原 | PASS（视觉 NEEDS_BROWSER） |
| 7 | 全屏 → 退出全屏 | 占满视口后再回普通态几何 | PASS（视觉 NEEDS_BROWSER） |
| 8 | 全屏 → 最小化 → 胶囊还原 | 回到普通态（非全屏） | PASS |
| 9 | 关闭后再开 | 默认尺寸位置，非上次几何 | PASS |
| 10 | 浮窗打开时切换另一文件 | 窗不关 | PASS |
| 11 | 浮窗打开时无法清空选中则跳过；若可取消选中 | 窗可不关，顶栏按钮变 disabled | PASS（重扫会 `selectedPath=null`，无独立取消选中 UI） |

- [x] **Step 3: 更新 design 状态** — 已改为「已实现」

---

## Spec coverage（自检）

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 未选禁用 / 已选可开 | Task 3、5 |
| 一键分析 / 最小 / 全屏 / 关闭 | Task 4、5 |
| 拖拽缩放 + 过小提示 | Task 2、4 |
| 左右占位 | Task 4 |
| message 占位、无接口 | Task 4 |
| 关闭重置 | Task 5（卸载） |
| 选中变化不自动关窗 | Task 5（mode 与 selectedPath 解耦） |
| 无遮罩 | Task 4（非 Modal） |
| react-rnd | Task 1 |
| 非目标（接口/图谱/记忆） | 全计划未引入 |

## Placeholder / 类型一致性自检

- 无 TBD；模式字面量统一为 `AnalysisPanelMode`
- 几何常量与阈值与 spec（480×320、默认约 720×480）一致
- 关闭文案与一键分析文案与 spec 一致

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-05 | Task 3 Header 示例与实现对齐：顶栏 `fabricIcon` +「知识织物工作台」 |
