# 测试参考（空项目模板）

> 自 **vitest-pure-fn-kit** 安装时复制到 `.cursor/skills/vitest-pure-fn/reference.md`。  
> 安装后在此表登记单测；Skill 正文见同目录 `SKILL.md`（脚手架已自带，不从 kit 复制）。

## 工具链

| 文件 | 作用 |
| --- | --- |
| `vitest.config.ts` | Node；`src/**/__tests__/**/*.test.ts` |
| `.cursor/rules/vitest-conventions.mdc` | 硬约束 |
| `docs/test/strategy.md` | 策略 |

**Node 20+**。

---

## 纯函数判定（摘要）

| # | 条件 |
| --- | --- |
| 1 | 相同输入 → 相同输出 |
| 2 | 无副作用 |
| 3 | Node 可直接 import |

---

## 项目单测索引（维护表）

| 源码 | 测试 |
| --- | --- |
| _（示例）_ `src/lib/example.ts` | `src/lib/__tests__/example.test.ts` |

### 待补测

| 模块 | 说明 |
| --- | --- |
| | |

---

## 命令

```powershell
yarn test
yarn lint
yarn build
```
