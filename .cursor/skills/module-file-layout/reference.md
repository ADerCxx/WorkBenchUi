# 模块目录 — 路径与标杆（可改项）

换项目时目录别名不同，**只改本表**；硬规则（一模块一文件夹、`types.ts`、hook 落盘）不变。

## 默认路径

| 项 | 默认 |
|----|------|
| 业务/页面根 | `src/pages/` |
| 自定义 hook 根 | `src/hooks/` |
| 路径别名 | `@/` → `src/` |

## 本仓标杆（对照用）

| 说明 | 路径 |
| --- | --- |
| 业务域 + types 集中 | `src/pages/Workbench/scan/types.ts` |
| 页面入口文件夹 | `src/pages/Workbench/index.tsx` |
| 组件模块（入口 + Props） | `src/pages/Workbench/components/CatalogTree/{index.tsx,types.ts}` |
| 自定义 hook（入口 + types） | `src/hooks/useAnalysisStream/{index.ts,types.ts}` |
| 同结构参考 | `WorkbenchHeader/`、`RawPreview/` |
