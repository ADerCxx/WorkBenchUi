# fabric 首页演示视频

日期：2026-08-07  
状态：已实现  
承接：`docs/superpowers/specs/2026-08-04-home-landing-design.md`（Hero + 空媒体占位）

## 目标

在首页（`/`）现有圆角媒体区嵌入本地演示视频，呈现接近 Qoder 官网「静音自动循环演示」的效果；成片可后补，未放片时不破版。

### 成功标准

1. 放入 `public/demo/ysVideo.mp4` 后，打开 `/` 媒体区静音自动循环播放，无控件、无悬停浮层/交互
2. 未放片或加载失败时，媒体区回退为浅灰圆角占位，布局不塌、控制台无未处理异常
3. Hero 文案、CTA、顶栏导航与布局结构不变（仍为「上 Hero、下媒体」）
4. 窄屏下视频仍在文案下方，不横向撑破
5. 系统 `prefers-reduced-motion: reduce` 时不自动播放

## 非目标

- 不改双栏（左文案右视频）布局
- 不引入播放器库、封面图系统、自定义播放控件
- 不改 Hero 文案 / CTA / 顶栏
- 不强制将大体积 mp4 纳入 git（本地或后续分发策略由使用者决定）
- 不探测文件是否存在（不做 HEAD 预检）

## 背景

`2026-08-04` 落地页已预留 `.media` 空占位（16:9、圆角），当时明确「本轮不嵌入视频」。现需在该占位落入本地演示片，交互参考 Qoder：静音、自动播放、循环、无控件；布局保持现有居中结构以控制改动面。

## 决策

采用 **方案 1：原生 `<video>` 直接嵌进现有 `.media`**。

| 决策点 | 选择 | 说明 |
|--------|------|------|
| 素材来源 | 本地静态 | `public/demo/ysVideo.mp4` → `/demo/ysVideo.mp4` |
| 播放行为 | 静音自动循环 | `muted` + `autoPlay` + `loop` + `playsInline`，无 `controls` |
| 交互 | 纯展示 | `pointer-events: none`；禁 PiP/下载等；无悬停浮层 |
| 布局 | 保持现有 | 上 Hero 居中 + 下媒体区 |
| 未放片 | onError 回退占位 | 不预检文件；失败则隐藏 video，保留浅灰占位 |
| 动效偏好 | 尊重系统设置 | `prefers-reduced-motion: reduce` 时不 autoPlay |
| 实现形态 | 不抽独立组件 | 改动限于 `Home` 页；YAGNI |

## 技术方案

### 改动文件

| 文件 | 变更 |
|------|------|
| `src/pages/Home/index.tsx` | `.media` 内挂 `<video>`；`onError` 切回占位态；按 reduced-motion 决定是否 autoPlay |
| `src/pages/Home/index.less` | video 铺满容器；有片时去掉虚线占位边（或等价视觉）；失败态沿用浅灰占位 |
| `public/demo/` | 目录占位（如 `.gitkeep`）；成片为 `ysVideo.mp4` |

### 结构

```text
Home
├── hero（不变：meta / title / subtitle / CTA）
└── .media
    └── <video>  （加载失败或未放片 → 仅保留 .media 占位外观）
```

### video 约定

- `src`：`${import.meta.env.BASE_URL}demo/ysVideo.mp4`（默认 base 为 `/` 时即 `/demo/ysVideo.mp4`）
- `muted` `loop` `playsInline`
- `autoPlay`：默认开启；`prefers-reduced-motion: reduce` 时关闭
- 无 `controls`；`disablePictureInPicture`；`controlsList="nodownload nofullscreen noremoteplayback"`
- 纯装饰展示：`aria-hidden`、`tabIndex={-1}`

### 样式约定

- 容器沿用：`max-width: 960px`、`aspect-ratio: 16 / 9`、圆角（桌面约 16px / 窄屏约 12px）
- video：`width/height: 100%`、`object-fit: cover`、`display: block`、`pointer-events: none`；隐藏 webkit media controls
- 有片：去掉虚线占位边，边框/阴影保持克制，贴近现有落地页气质
- 失败/未放片：浅灰底 + 虚线边（与当前占位一致）

### 失败态

- 依赖 `<video onError>`；不额外发网络探测请求
- 失败后不再反复重试；用户补文件后刷新页面即可

### 资源与仓库

- 约定路径：`public/demo/ysVideo.mp4`
- 可先提交 `public/demo/.gitkeep`；是否 ignore `*.mp4` 由实现时按仓库策略处理（建议大文件不进 git）

## 测试要点

1. 放入成片后打开 `/`：静音自动循环，无控件；悬停无浏览器浮层/可选功能
2. 未放片或错误路径：浅灰圆角占位，布局正常
3. Hero / CTA / 顶栏行为与改前一致
4. 窄屏（≤768px）：视频在文案下，不横向溢出
5. 开启系统「减少动态效果」：不自动播放

## 实现备注

实现前按 `writing-plans` 产出 plan；实现后若有 design/plan 偏差，按仓库 `sync-design-plan` 约定回写。

## 修订记录

- 2026-08-07：初稿 — 方案 1（原生 video + 现有媒体区 + onError 占位）
- 2026-08-07：按 plan 实现 — Home 原生 video + onError 占位 + reduced-motion
- 2026-08-07：成片改为 `ysVideo.mp4`；禁悬停交互（pointer-events / PiP / media controls）
