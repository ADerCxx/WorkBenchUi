---
name: git-merge-leave-working-tree
description: >-
  功能分支开发后合回 main 时，把改动留在工作区由用户手动 commit，不替用户提交。
  在 finishing-a-development-branch 选「本地合并回 main」、subagent-driven-development
  收尾合回、或用户说合回 main / 合并到主分支 / 改动留在工作区自己提交时使用。
---

# 合回 main：改动留在工作区

覆盖 `finishing-a-development-branch` 选项 1（本地合并）及等价合回流程。  
**不**改变「可用本地 feature 分支 / worktree 做隔离开发」的做法；约束只发生在**合回 main 时**。

## 硬约束

合回完成后必须满足：

1. 当前在 `main`（或约定的主分支）
2. **未**执行面向用户的 `git commit`（也勿留下「已提交、仅未 push」就算完成）
3. 相关改动在**工作区**可见（modified / untracked；暂存与否不限）
4. 提示用户自行 `git add` / `git commit`

未获用户明确要求时，不主动 commit、不 push（与既有约定一致）。

## 推荐步骤

**功能分支上已有 commit：**

```bash
git checkout main
git merge --no-commit --no-ff <feature-branch>
# 如需与「未暂存工作区」一致：git reset HEAD
```

或：`git cherry-pick -n <sha>…`

**功能分支仅有工作区改动（无 commit）：**

用 stash / 带改动切回 `main`，确保最终停在 `main` 且改动可见、未 commit。

合并意图完成后，若用户未要求保留，可删除已无用的本地功能分支。

## 禁止

```text
# ❌
git commit ...
git checkout main
git merge <feature>    # 结果：main 上已有新 commit
```

```text
# ✅
git checkout main
git merge --no-commit --no-ff <feature>
# 说明：改动已在 main 工作区，请手动 commit
```

## 与 SDD 的关系

- **开发期**（`subagent-driven-development` / plan Task）：可开 feature 分支；plan 里「Commit」步骤默认跳过，除非用户明确要求提交。
- **收尾期**（`finishing-a-development-branch` 选项 1）：**必须**读本 skill，用「无 commit 合回」替代 skill 原文中的 commit→merge 流程。
