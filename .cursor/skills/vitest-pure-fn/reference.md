# 测试参考

## kit 与索引

| 文档 | 用途 |
| --- | --- |
| [templates/README.md](../../templates/README.md) | kit 与 skill 分工说明 |
| [vitest-pure-fn-kit/INDEX.md](../../templates/vitest-pure-fn-kit/INDEX.md) | 可安装文件清单 |
| [vitest-pure-fn-kit/README.md](../../templates/vitest-pure-fn-kit/README.md) | 安装参考（按需） |
| [docs/test/strategy.md](../../../docs/test/strategy.md) | 本仓测试策略 |

**Node 20+**。改 kit 默认 → 先改 `templates/vitest-pure-fn-kit/`，再同步落地文件。

---

## 工具链（本仓）

| 文件 | 作用 |
| --- | --- |
| `vitest.config.ts` | Node；`src/**/__tests__/**/*.test.ts` |
| `.cursor/rules/vitest-conventions.mdc` | 硬约束 |
| `.cursor/rules/verify-after-edit.mdc` | lint + test + build |

---

## 纯函数判定（摘要）

| # | 条件 | 反例 |
| --- | --- | --- |
| 1 | 确定性输出 | `Date.now()` |
| 2 | 无副作用 | 文件 API、DOM |
| 3 | Node 可 import | 组件、hooks |

---

## 项目单测索引（维护表）

> 新增/移动/删除单测时 **同步更新**。

| 源码 | 测试 |
| --- | --- |
| `src/components/MarkdownPreview/parseFrontmatter.ts` | `.../__tests__/parseFrontmatter.test.ts` |
| `src/apis/qoderSessions/conversation/parseSseData.ts` | `.../__tests__/parseSseData.test.ts` |
| `src/pages/Workbench/scan/buildTree.ts` | `.../scan/__tests__/buildTree.test.ts` |
| `src/pages/Workbench/scan/whitelistMatch.ts` | `.../scan/__tests__/whitelistMatch.test.ts` |
| `src/pages/Workbench/components/AnalysisPanel/fileNameFromPath.ts` | `.../__tests__/fileNameFromPath.test.ts` |
| `src/pages/Workbench/components/AnalysisPanel/panelGeometry.ts` | `.../__tests__/panelGeometry.test.ts` |
| `src/pages/Workbench/components/AnalysisPanel/resultChrome.ts` | `.../__tests__/resultChrome.test.ts` |
| `RelationGraph/parseGraphJson.ts` | `.../__tests__/parseGraphJson.test.ts` |
| `RelationGraph/toFlowElements.ts` | `.../__tests__/toFlowElements.test.ts` |
| `RelationGraph/matchWorkbenchPath.ts` | `.../__tests__/matchWorkbenchPath.test.ts` |

### 待补测

（登记待测纯函数。）

---

## 命令

```powershell
yarn test
yarn vitest run path/to/__tests__/foo.test.ts
yarn lint
yarn build
```
