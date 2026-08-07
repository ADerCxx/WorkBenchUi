# Home Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 在首页现有圆角媒体区嵌入本地演示视频（静音自动循环、无控件）；未放片时回退浅灰占位。

**Architecture:** 仅改 `src/pages/Home`：`.media` 内挂原生 `<video>`；`onError` 隐藏 video 并保留占位样式；用 `matchMedia('(prefers-reduced-motion: reduce)')` 决定是否 `autoPlay`；纯展示无悬停交互。资源约定 `public/demo/ysVideo.mp4`。Design 见 `docs/superpowers/specs/2026-08-07-home-demo-video-design.md`。

**Tech Stack:** React 19、原生 HTMLVideoElement、CSS Modules（Less）、Vite `public/` 静态资源

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。本轮无组件单测，以手工验收为主。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/pages/Home/index.tsx` | Hero 不变；媒体区挂 video + failed / reduced-motion 状态 |
| `src/pages/Home/index.less` | `.media` / `.video` / 失败占位样式 |
| `public/demo/.gitkeep` | 保证目录进库；成片为 `ysVideo.mp4` |
| `docs/superpowers/specs/2026-08-07-home-demo-video-design.md` | 实现后状态改为已实现 |
| `docs/superpowers/plans/2026-08-07-home-demo-video.md` | 本 plan |

不新建独立视频组件；不改路由、Layout、Hero 文案。

---

### Task 1: 建立 `public/demo` 目录占位

**Files:**
- Create: `public/demo/.gitkeep`

- [x] **Step 1: 创建目录占位**

创建空文件 `public/demo/.gitkeep`（无内容即可）。用户将成片命名为 `ysVideo.mp4` 放入同目录。

- [x] **Step 2: 确认路径约定**

成片访问 URL：`${import.meta.env.BASE_URL}demo/ysVideo.mp4`（默认 base 为 `/` 时即 `/demo/ysVideo.mp4`）。

- [x] **Step 3: 跳过 git commit**（除非用户明确要求提交）

---

### Task 2: Home 挂载 video + 失败 / 动效偏好

**Files:**
- Modify: `src/pages/Home/index.tsx`
- Modify: `src/pages/Home/index.less`

- [x] **Step 1: 重写 `src/pages/Home/index.tsx`**

将整文件替换为：

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './index.less';

const DEMO_SRC = `${import.meta.env.BASE_URL}demo/ysVideo.mp4`;

/**
 * 首页：产品落地页（Hero + 本地演示视频）
 */
function Home() {
  const [failed, setFailed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAutoPlay(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.meta}>产品 · 工作台</p>
        <h1 className={styles.title}>欢迎使用 fabric</h1>
        <p className={styles.subtitle}>本地扫描 · 白名单匹配 · 原文预览</p>
        <Link to="/workbench" className={styles.cta}>
          进入工作台
          <span className={styles.ctaArrow} aria-hidden>
            ↗
          </span>
        </Link>
      </section>
      <div
        className={failed ? `${styles.media} ${styles.mediaEmpty}` : styles.media}
      >
        {!failed ? (
          <video
            className={styles.video}
            src={DEMO_SRC}
            muted
            autoPlay={autoPlay}
            loop
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Home;
```

- [x] **Step 2: 更新 `src/pages/Home/index.less`**

将整文件替换为：

```less
.page {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px 48px;
  box-sizing: border-box;
  background: var(--bg);
  color: var(--text-h);
}

.hero {
  width: 100%;
  max-width: 820px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.meta {
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text);
  letter-spacing: 0.02em;
}

.title {
  margin: 0 0 14px;
  font-family: var(--display);
  font-size: 48px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--text-h);
}

.subtitle {
  margin: 0 0 28px;
  font-size: 20px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--text-h);
  opacity: 0.85;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  background: var(--text-h);
  color: var(--bg);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;

  &:hover {
    opacity: 0.88;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.ctaArrow {
  font-size: 14px;
  line-height: 1;
}

.media {
  width: 100%;
  max-width: 960px;
  margin-top: 36px;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  box-sizing: border-box;
  overflow: hidden;
}

.mediaEmpty {
  border-style: dashed;
}

.video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;

  &::-webkit-media-controls {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 36px 16px 32px;
  }

  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 16px;
    margin-bottom: 22px;
  }

  .media {
    margin-top: 24px;
    border-radius: 12px;
  }
}
```

- [x] **Step 3: 类型检查 / lint**

Run: `npm run build`  
Expected: 通过（无 TS/ESLint 错误）。若本地无成片，构建仍应成功（静态资源缺失不影响 `tsc` / Vite build）。

- [x] **Step 4: 跳过 git commit**（除非用户明确要求提交）

---

### Task 3: 手工验收 + 回写 design 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-07-home-demo-video-design.md`（状态 → 已实现）

- [x] **Step 1: 未放片验收**

Run: `npm run dev`，打开 `/`  
Expected:

1. Hero / CTA / 顶栏与改前一致
2. 媒体区为浅灰圆角 + **虚线**边（`mediaEmpty`），无破版、无未处理异常
3. 窄屏（≤768px）布局正常

- [ ] **Step 2: 有片验收**（待用户放入 `ysVideo.mp4` 后浏览器补验）

将成片放为 `public/demo/ysVideo.mp4`，硬刷新 `/`  
Expected:

1. 媒体区静音自动循环播放，无控件；悬停无浮层
2. 边框为实线（非虚线）
3. 删除或改名该文件并刷新 → 回到虚线占位

- [ ] **Step 3: reduced-motion 验收**（待用户放入成片后浏览器补验）

在系统或浏览器中开启「减少动态效果」后刷新 `/`（有片时）  
Expected: video 不自动播放（可停在首帧）。

- [x] **Step 4: 回写 design 状态**

将 `docs/superpowers/specs/2026-08-07-home-demo-video-design.md` 顶部：

```markdown
状态：设计中
```

改为：

```markdown
状态：已实现
```

并在「修订记录」追加一行：

```markdown
- 2026-08-07：按 plan 实现 — Home 原生 video + onError 占位 + reduced-motion
```

- [x] **Step 5: 跳过 git commit**（除非用户明确要求提交）

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 本地 `/demo/ysVideo.mp4` | Task 1 + Task 2 `DEMO_SRC` |
| muted / autoPlay / loop / playsInline，无 controls；无悬停交互 | Task 2 |
| 布局保持上 Hero 下媒体 | Task 2（结构未改） |
| onError 回退浅灰占位 | Task 2 `failed` + `.mediaEmpty` |
| prefers-reduced-motion 不 autoPlay | Task 2 `matchMedia` |
| 窄屏不撑破 | Task 2 less + Task 3 验收 |
| 不抽播放器组件 / 不改 Hero | 全 plan 范围 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-07-home-demo-video.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 每个 Task 派一个新子代理，Task 间复核，迭代快  

**2. Inline Execution** — 本会话按 executing-plans 逐步执行，带检查点  

Which approach?
