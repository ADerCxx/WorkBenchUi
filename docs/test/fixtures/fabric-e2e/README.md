# Fabric 浏览器全流程勾验夹具

工作台「选择文件夹」时，请选本目录（`docs/test/fixtures/fabric-e2e`）作为项目根。

## 为何这样放

现网启用规则含：`folderName=docs` + `filePattern=\.mdc?$`。  
本夹具根下仅有一层 `docs/`，扫描结果稳定为 2 个样例文件，不夹杂整仓文档。

## 勾验顺序

1. 打开 `/workbench`，选择本目录
2. 左侧应只见 `docs/flow-preview.md`、`docs/flow-relate.mdc`
3. 点选 `flow-preview.md`：右侧预览应无 YAML 头，仅正文
4. 点选 `flow-relate.mdc` → 一键分析 → 看流式结果与关系图谱
5. 若图谱节点带 `path`，点击应联动选中对应文件
