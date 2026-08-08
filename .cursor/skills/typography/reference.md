# Typography — 路径与加载（可改项）

换项目时字体栈文件不同，**只改本表**；四角色语义（`--sans` / `--heading` / `--display` / `--mono`）不变。

## 默认路径

| 项 | 默认 |
|----|------|
| CSS 变量 / 字体栈定义 | `src/styles/index.global.less` |
| 组件库 `fontFamily` 同步（若有） | `src/main.tsx`（与 `--sans` 字面量同步） |
| 字体加载 | `index.html`（如 Google Fonts CDN，含 Noto Sans SC） |

## 角色 ↔ 常见字体（仅定义处使用）

| 变量 | 本仓常见栈（示例） |
|------|-------------------|
| `--sans` | Inter, Noto Sans SC, … |
| `--heading` | Space Grotesk, … |
| `--display` | Space Grotesk（或品牌专用）, … |
| `--mono` | IBM Plex Mono, … |

组件代码中仍只写 `var(--…)`，不写上表族名。
