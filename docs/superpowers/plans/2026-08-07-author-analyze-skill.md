# 元 Skill：按文档类型产出解析 Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 WorkBench 落一份可执行元 Skill，使 Agent 能按文档类型探索并产出可带走的解析 Skill（`<目标根>/<name>/SKILL.md`）。

**Architecture:** 单文件流水线 Skill：收输入 → 找材料 → 抽共性/问题清单 → 读者透镜 → 探索摘要确认门 → 生成落盘 + 自检。方法论并入该 Skill；生成物不绑 WorkBench 业务目录。

**Tech Stack:** Cursor Agent Skill（Markdown + YAML frontmatter）；无运行时代码、无单测框架。

**Spec:** `docs/superpowers/specs/2026-08-07-author-analyze-skill-design.md`

**Note:** 按用户规则，实现过程中不自动 git commit。下文若出现 Commit 步骤一律跳过，除非用户明确要求提交。

---

## File Structure

| 路径 | 职责 |
|------|------|
| `.cursor/skills/author-analyze-skill/SKILL.md` | **新建**：元 Skill 正文（流程、门禁、生成物形态、自检） |
| `src/工作台内置解析Skill探索方法论.md` | **删除**（内容已吸收进元 Skill；作者自有备份） |
| `docs/superpowers/specs/2026-08-07-author-analyze-skill-design.md` | 收尾：状态 → 已实现 |

**定稿命名：** 元 Skill `name` = `author-analyze-skill`（目录名一致）。

---

### Task 1: 创建元 Skill 目录与完整 SKILL.md

**Files:**

- Create: `.cursor/skills/author-analyze-skill/SKILL.md`

- [ ] **Step 1: 创建目录并写入完整 SKILL.md**

将下列内容写入 `.cursor/skills/author-analyze-skill/SKILL.md`（勿删减门禁；文风可微调措辞但不得改决策）：

````markdown
---
name: author-analyze-skill
description: >-
  Use when 需要按文档类型产出「解析 Skill」：先在仓库找该类文档的生成约定与样例，
  抽共性或退回读者问题清单，确认探索摘要后，在目标项目根落盘 <name>/SKILL.md。
  显式点名使用；用于编写可带走的文档分析手册，不负责对单份文档做分析本身。
---

# 编写文档解析 Skill

## 角色

你是 **解析 Skill 作者**：按探索流水线，为某一类 Markdown 约定文档写出一本「懂这类约定的阅读助手」手册（解析 Skill）。

生成物给 Agent 用，约束它对**该类文档**做短、可扫读、突出重点的分析。
你现在写的是**元流程**；不要跳过确认门直接分析用户手里的那一份业务文档就交差。

## 宗旨

用懂这类约定的分析 Skill 约束 Agent。
这类 md 多半由 AI + Skill/约定生成，因此**有迹可循**——先找生成规律，再定读者透镜。

## 何时用 / 何时不用

**用：** 用户要「给某某类文档做一份解析 Skill / analyze skill」。
**不用：** 用户只是要读懂/分析某一份已有文档（应改用已有解析 Skill，而不是本 Skill）。
**第一版范围：** 仅 Markdown 类约定文档；非 md 直接说明超出范围。

## 输入

| 项 | 必填 | 默认 |
| --- | --- | --- |
| 文档类型名 | 是 | — |
| 目标项目根 | 否 | 当前工作区根 |
| `name` | 否 | `analyze-<短横线类型>`（小写+连字符） |
| 样例路径/正文、生成约定路径 | 否 | 先自助搜索 |

## 流程（按序；未过门禁不得写盘）

### 1. 收输入

确认文档类型名；解析目标根与拟定 `name`。
向用户复述一次拟定落盘路径：`<目标根>/<name>/SKILL.md`。

### 2. 找材料（先自助）

在目标仓库搜索：

- 生成该类文档的 Skill / 约定 / 说明书
- 同类型样例 `.md`（多份）

**门槛：**

- 建议至少 **2** 份样例再写「强约定」
- 仅 **1** 份：须用户声明「仅此一份」或明确要求继续；约定表标弱/可选
- **0** 份且用户未提供：停，说明缺什么，请补路径或正文

### 3. 抽规律

- 多份对照：反复出现的结构/字段 → 约定速查
- 仅个别出现 → 标「可选 / 可能缺失」
- 几乎无稳定章节 → **问题清单模式**（不写假章节表）

禁止把偶然写法写成「必须有」。禁止编造未出现的路径、Skill、依赖。

### 4. 读者透镜

回答：读这类文档时，用户最想知道什么？
列出少量可扫读条目——这就是解析 Skill 的**输出约束来源**。
可保留极少共通信息类型（如「这是什么」「关联到什么」），**不定死过多固定标题**。

### 5. 探索结论摘要（确认门）

先输出摘要，**等用户确认后再写盘**。摘要至少含：

- 文档类型、拟定 `name`、完整落盘路径
- 材料来源（路径列表）
- 模式：共性约定 / 问题清单
- 读者问题清单草稿
- 拟要求的少量共通信息类型
- 风险（样本少、亚型混杂等）

未确认 → 不创建目录、不写 `SKILL.md`。

### 6. 生成并落盘

确认后写入 `<目标根>/<name>/SKILL.md`（目录名 = `name`）。

若该路径已存在 `SKILL.md`：**拒绝覆盖**，请用户改 `name` 或明确说「覆盖」。

### 7. 落盘前自检

- [ ] 无编造路径/依赖
- [ ] 难懂术语已改白话（关联分类名尤其要白话）
- [ ] 输出约束来自第 4 步读者问题，而非套用无关模板
- [ ] 要求解析时做**文件关系**分析
- [ ] 文风：中文、短句、可扫读、篇幅宜短；不确定写「正文未写明」

## 生成物形态（解析 Skill）

标准 Cursor Skill 包：仅需 `SKILL.md`。

### frontmatter

只要：

```yaml
name: <与目录名一致>
description: >-
  Use when 对<文档类型>做辅助分析：…（第三人称 + 触发场景）
```

不要强行加其它 frontmatter 字段。

### 正文建议块（标题可微调）

1. **角色** — 懂该类约定的阅读助手；默认只读分析、不改文件
2. **文档长什么样** — 约定速查表，**或**说明进入问题清单模式
3. **输入** — 只信任调用方正文（可附路径）；截断要标明
4. **分析步骤** — 短、按序、可执行
5. **输出约束** — 以读者问题为纲；少量共通信息类型即可
6. **文风** — 同上自检；**文件关系必要**

### 生成物禁止项

- 假必须章节
- 编造关联
- 难懂术语堆砌

## 错误与停手

| 情况 | 行为 |
| --- | --- |
| 无样例且用户未提供 | 停，请补 |
| 仅 1 份且未声明继续 | 可给摘要，不落盘 |
| 同名已存在 | 拒绝覆盖，除非用户明确覆盖 |
| 目标根无效/不可写 | 报错，请指定可用根 |
| 摘要未确认 | 不落盘 |
| 非 Markdown 范围 | 说明超出第一版范围 |

## 成功标准

- 走完摘要 → 确认 → 落盘，得到可用的 `<name>/SKILL.md`
- 输出约束能追溯到读者问题，且含文件关系与文风要求
````

- [ ] **Step 2: 确认文件存在且 name 正确**

Run:

```powershell
cd D:\myComponent\WorkBench
Test-Path ".cursor/skills/author-analyze-skill/SKILL.md"
Select-String -Path ".cursor/skills/author-analyze-skill/SKILL.md" -Pattern "^name:"
```

Expected:

```
True

.cursor/skills/author-analyze-skill/SKILL.md:2:name: author-analyze-skill
```

- [ ] **Step 3: 对照 Spec 做静态清单（本步不跑 Agent）**

打开刚写的 Skill，确认正文同时出现这些关键词/小节（缺则补）：

| Spec 要求 | 正文应含 |
|-----------|----------|
| 先自助再要样例 | 「找材料」「先自助」 |
| ≥2 份强约定 / 1 份须声明 | 「至少 **2**」「仅 **1**」 |
| 问题清单回退 | 「问题清单模式」 |
| 确认门 | 「确认门」或「等用户确认后再写盘」 |
| 落盘路径 | `<目标根>/<name>/SKILL.md` |
| 拒绝覆盖 | 「拒绝覆盖」 |
| 生成物 frontmatter 仅 name+description | 「不要…强行加其它 frontmatter」 |
| 读者问题为输出约束 | 「输出约束来源」 |
| 文件关系必要 | 「文件关系」 |
| 只面向 md | 「仅 Markdown」 |

---

### Task 2: 删除方法论文档

**Files:**

- Delete: `src/工作台内置解析Skill探索方法论.md`

- [ ] **Step 1: 确认作者已有备份（对话中已声明有备份；若不确定先停）**

若不确定是否有备份：先复制到临时路径再删。默认按已有备份处理。

- [ ] **Step 2: 删除文件**

Run:

```powershell
cd D:\myComponent\WorkBench
Remove-Item -LiteralPath "src/工作台内置解析Skill探索方法论.md"
Test-Path -LiteralPath "src/工作台内置解析Skill探索方法论.md"
```

Expected: `False`

- [ ] **Step 3: 确认仓库内无硬编码依赖该方法论文档路径**

Run:

```powershell
cd D:\myComponent\WorkBench
rg "工作台内置解析Skill探索方法论" -g "!docs/superpowers/**"
```

Expected: 无业务代码命中（`docs/superpowers` 下的 spec/plan 提及可保留）。若 `src` 下仍有引用，改为指向 `.cursor/skills/author-analyze-skill/SKILL.md`。

---

### Task 3: 干跑验证（对照 Spec 测试要点）

**Files:** 无代码改动；用 Cursor 显式加载 `author-analyze-skill` 做行为核对。

说明：无 Vitest；以下为人工/Agent 干跑检查表。实现 Agent 在对话中执行，不必真的落盘到业务根（可用临时目录作目标根）。

- [ ] **Step 1: 材料充足路径（共性模式）**

提示词示例：

```text
使用 author-analyze-skill：文档类型 = superPowers design spec；
目标根 = D:\myComponent\WorkBench\_tmp_skill_out；
请先找 docs/superpowers/specs 下多份 *-design.md，走完到「探索结论摘要」后停下，等我确认再落盘。
```

Expected:

- 找到 ≥2 份样例
- 给出探索摘要（含 name、路径、模式、读者问题）
- **在你回复「确认」之前**，`D:\myComponent\WorkBench\_tmp_skill_out` 下不应出现新的 `SKILL.md`

- [ ] **Step 2: 确认后落盘**

回复确认后：

Expected: 出现 `D:\myComponent\WorkBench\_tmp_skill_out/<name>/SKILL.md`，且含 frontmatter `name`/`description`、输出约束、文件关系、文风。

- [ ] **Step 3: 无材料停手**

提示词示例：

```text
使用 author-analyze-skill：文档类型 = 一种仓库里根本不存在的虚构文档类型 FooBarBazQuux；
不要使用我提供的样例；目标根随意。先找材料。
```

Expected: 停，请用户补样例；不落盘。

- [ ] **Step 4: 同名拒绝覆盖**

在目标根先放一个同名 `<name>/SKILL.md`，再跑同一类型并确认落盘。

Expected: 拒绝覆盖，除非明确说「覆盖」。

- [ ] **Step 5: 清理临时目录（可选）**

```powershell
Remove-Item -Recurse -Force "D:\myComponent\WorkBench\_tmp_skill_out" -ErrorAction SilentlyContinue
```

---

### Task 4: 更新 Spec 状态

**Files:**

- Modify: `docs/superpowers/specs/2026-08-07-author-analyze-skill-design.md`

- [ ] **Step 1: 将状态改为已实现**

把文件头：

```markdown
状态：设计中
```

改为：

```markdown
状态：已实现
```

并在文末「实现备注」下追加一行：

```markdown
- 元 Skill 落盘：`.cursor/skills/author-analyze-skill/SKILL.md`
```

- [ ] **Step 2: 打开 spec 确认状态行已更新**

Run:

```powershell
cd D:\myComponent\WorkBench
Select-String -Path "docs/superpowers/specs/2026-08-07-author-analyze-skill-design.md" -Pattern "^状态："
```

Expected: `状态：已实现`

---

## Spec Coverage Checklist

| Spec 条目 | 对应 Task |
|-----------|-----------|
| 仅元 Skill 交付 | Task 1 + Task 2 |
| 显式点名 / 不接 UI | Task 1 正文「何时用」 |
| 先自助再要样例 | Task 1 流程 §2 |
| 共性 + 问题清单 | Task 1 流程 §3 |
| 两段式确认 | Task 1 流程 §5；Task 3 Step 1–2 |
| 目标根 `/<name>/SKILL.md` | Task 1 流程 §6 |
| 拒绝覆盖 | Task 1；Task 3 Step 4 |
| frontmatter 仅 name+description | Task 1 生成物形态 |
| 读者问题为纲、少固定标题 | Task 1 流程 §4 |
| 删除/吸收方法论文档 | Task 2 |
| 测试要点 | Task 3 |
| 命名定稿 `author-analyze-skill` | File Structure + Task 1 |

---

## Self-Review Notes

- 无 TBD/TODO 占位。
- 验证以干跑清单代替单元测试（交付物为 Skill 文档，符合 YAGNI）。
