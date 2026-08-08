# Workbench Playwright E2E（夹具注入）

日期：2026-08-08  
状态：已撤销

## 说明

曾尝试 Playwright + `window.__FABRIC_E2E__.loadFixture` 自动化 §3.6，因需改动业务代码挂测试缝，已按产品侧要求撤销。

**保留**：人工勾验夹具 `docs/test/fixtures/fabric-e2e`。  
**不保留**：业务侧 `__FABRIC_E2E__`、`data-testid`、Playwright 工程与依赖。

浏览器主路径仍以测试文档 §3.6 人工勾验为准。
