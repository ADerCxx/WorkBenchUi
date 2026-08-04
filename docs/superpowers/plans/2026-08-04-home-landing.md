# Home Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/` 首页与 `MainLayout` 顶栏改成接近 OpenAI Images 2.0 气质的落地页：左导航、右 CTA、居中 Hero、空媒体区；CTA 进入 `/workbench`。

**Architecture:** 只改 `MainLayout`（顶栏布局 + 右侧黑胶囊 CTA）与 `Home`（整页替换为落地页）。路由表不动。文案写死。Design 见 `docs/superpowers/specs/2026-08-04-home-landing-design.md`。

**Tech Stack:** React 19、react-router-dom `Link`、CSS Modules（Less）、现有全局 CSS 变量

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/layouts/MainLayout/index.tsx` | 左 Logo+导航，右 CTA |
| `src/layouts/MainLayout/index.less` | 顶栏 flex / CTA pill |
| `src/pages/Home/index.tsx` | 落地页 Hero + 空媒体区 |
| `src/pages/Home/index.less` | Hero / 元信息 / CTA / 媒体占位 |
| `docs/superpowers/specs/2026-08-04-home-landing-design.md` | 实现后状态改为已实现 |
| `docs/superpowers/plans/2026-08-04-home-landing.md` | 本 plan |

不新建页面组件；不改 `src/router/index.tsx`。

---

### Task 1: MainLayout 顶栏（左导航 + 右 CTA）

**Files:**
- Modify: `src/layouts/MainLayout/index.tsx`
- Modify: `src/layouts/MainLayout/index.less`

- [x] **Step 1: 重写 MainLayout 结构**

将 `src/layouts/MainLayout/index.tsx` 整文件替换为：

```tsx
import { Link, Outlet } from 'react-router-dom';
import styles from './index.less';

/**
 * 主站 Layout：左侧 Logo+导航，右侧进入工作台 CTA，子路由出口
 */
function MainLayout() {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.brand} aria-label="fabric 首页">
            <img
              className={styles.logo}
              src={`${import.meta.env.BASE_URL}fabricIcon.png`}
              alt="fabric"
            />
          </Link>
          <Link to="/">首页</Link>
          <Link to="/workbench">工作台</Link>
          <Link to="/regex-settings">正则设置</Link>
        </div>
        <Link to="/workbench" className={styles.cta}>
          进入工作台
          <span className={styles.ctaArrow} aria-hidden>
            ↗
          </span>
        </Link>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
```

- [x] **Step 2: 更新 MainLayout 样式**

将 `src/layouts/MainLayout/index.less` 整文件替换为：

```less
.layout {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 28px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg);

  a {
    color: var(--text-h);
    text-decoration: none;
    font-size: 14px;

    &:hover {
      opacity: 0.75;
    }
  }
}

.navLeft {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex-wrap: wrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;

  &:hover {
    opacity: 0.85;
  }
}

.logo {
  display: block;
  height: 28px;
  width: auto;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--text-h);
  color: var(--bg) !important;
  font-size: 13px;
  line-height: 1.2;
  text-decoration: none;

  &:hover {
    opacity: 0.88;
  }
}

.ctaArrow {
  font-size: 12px;
  line-height: 1;
}

.main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .nav {
    padding: 12px 16px;
  }

  .navLeft {
    gap: 12px;
  }
}
```

- [x] **Step 3: 目视验收顶栏**

Run: 若 `pnpm dev` 已在跑则刷新 `/`；否则在 `D:\myComponent\WorkBench` 执行 `pnpm dev`，打开首页。

Expected:
- 左侧：fabric 图标 + 首页 / 工作台 / 正则设置
- 右侧：黑胶囊「进入工作台 ↗」
- 无登录、无搜索
- 点击右侧 CTA 进入 `/workbench`

- [ ] **Step 4: Commit（仅当用户明确要求时再执行；默认跳过）**

```powershell
git add src/layouts/MainLayout/index.tsx src/layouts/MainLayout/index.less
git commit -m "feat: MainLayout 左导航与右侧进入工作台 CTA"
```

---

### Task 2: Home 落地页重写

**Files:**
- Modify: `src/pages/Home/index.tsx`
- Modify: `src/pages/Home/index.less`

- [x] **Step 1: 重写 Home 组件**

将 `src/pages/Home/index.tsx` 整文件替换为：

```tsx
import { Link } from 'react-router-dom';
import styles from './index.less';

/**
 * 首页：产品落地页（Hero + 空媒体占位）
 */
function Home() {
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
      <div className={styles.media} aria-hidden />
    </div>
  );
}

export default Home;
```

- [x] **Step 2: 重写 Home 样式**

> **实现备注（质量审查补充）：** 实际样式另增加 CTA `:focus-visible` 焦点环；`.meta` / `.media` 使用 `var(--text)`、`var(--code-bg)`、`var(--border)` 替代硬编码 hex，以适配 dark mode。

将 `src/pages/Home/index.less` 整文件替换为：

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
  color: #8a8a8a;
  letter-spacing: 0.02em;
}

.title {
  margin: 0 0 14px;
  font-size: 48px;
  font-weight: 700;
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
  line-height: 1.2;
  text-decoration: none;

  &:hover {
    opacity: 0.88;
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
  background: #f4f4f4;
  border: 1px dashed #cfcfcf;
  box-sizing: border-box;
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

- [x] **Step 3: 目视验收首页**

Run: 刷新 `/`（或 `pnpm dev`）。

Expected:
- 无 Vite 计数器、无请求示例、无 Documentation / Connect 区块
- 可见：元信息、大标题、副标题、黑胶囊 CTA、下方空圆角媒体区
- Hero CTA 进入 `/workbench`
- 窄屏（DevTools ≤768px）标题缩小、布局不横向严重溢出

- [x] **Step 4: 类型检查 / 构建冒烟（可选但推荐）**

Run: `pnpm exec tsc -b --pretty false`（或 `pnpm build`）

Expected: 无因 Home 删除 `useRequest` / 资源 import 导致的类型错误

- [ ] **Step 5: Commit（仅当用户明确要求时再执行；默认跳过）**

```powershell
git add src/pages/Home/index.tsx src/pages/Home/index.less
git commit -m "feat: 首页改为 fabric 落地页 Hero 与空媒体区"
```

---

### Task 3: 同步 design / plan 状态

**Files:**
- Modify: `docs/superpowers/specs/2026-08-04-home-landing-design.md`
- Modify: `docs/superpowers/plans/2026-08-04-home-landing.md`（本文件，勾选已完成步骤）

- [x] **Step 1: 更新 design 状态**

在 `docs/superpowers/specs/2026-08-04-home-landing-design.md`：
- 将 `状态：待实现` 改为 `状态：已实现`
- 文末追加：

```markdown
## 修订记录

- 2026-08-04：已按方案 A（导航靠左）实现 MainLayout + Home 落地页
```

- [x] **Step 2: 勾选本 plan 中已完成的 Task 1–3 步骤**

- [ ] **Step 3: Commit（仅当用户明确要求时再执行；默认跳过）**

```powershell
git add docs/superpowers/specs/2026-08-04-home-landing-design.md docs/superpowers/plans/2026-08-04-home-landing.md
git commit -m "docs: 同步首页落地页 design/plan 已实现状态"
```

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|-----------|-----------|
| Hero 文案与结构 | Task 2 |
| 顶栏左导航 + 右 CTA，无登录/搜索 | Task 1 |
| CTA → `/workbench` | Task 1 + Task 2 |
| 去掉演示内容 | Task 2 |
| 空媒体区 16:9 圆角 | Task 2 |
| 窄屏可用 | Task 1 + Task 2 media query |
| 路由不变 | 未改 router（显式非目标） |
| design 回写 | Task 3 |
