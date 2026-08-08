# CSS Module + Less — 路径与标杆（可改项）

换项目时主题文件路径不同，**只改本表**；硬规则（禁大块静态内联、CSS Module、角色变量）不变。

## 默认路径

| 项 | 默认 |
|----|------|
| 全局主题 / CSS 变量 | `src/styles/index.global.less` |
| 其它全局样式 | `src/styles/*.global.less` |

## 本仓标杆（对照用）

| 说明 | 路径 |
|------|------|
| 页面 + less | `src/pages/Home/{index.tsx,index.less}` |
| Layout + less | `src/layouts/MainLayout/{index.tsx,index.less}` |
| 业务组件 + less | `src/pages/Workbench/components/AnalysisPanel/{index.tsx,index.less}` |
