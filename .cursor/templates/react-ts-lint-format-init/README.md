# react-ts-lint-format-init 跨项目工具包

在任意 **React + TypeScript** 仓库初始化编辑期工具链：ESLint 9 Flat + Prettier 3 + EditorConfig。可选附带 Cursor `afterFileEdit` 自动 Prettier（≠ Husky）。

## 安装（新项目）

在目标仓库根目录执行（PowerShell 示例；路径按实际调整）：

```powershell
# 1) 整包放入 templates（真源）
New-Item -ItemType Directory -Force -Path .cursor\templates | Out-Null
Copy-Item -Recurse -Force `
  <WorkBench>\.cursor\templates\react-ts-lint-format-init `
  .cursor\templates\

# 2) 安装可发现的 Skill（Cursor 会读 .cursor/skills/**/SKILL.md）
New-Item -ItemType Directory -Force -Path .cursor\skills\react-ts-lint-format-init | Out-Null
Copy-Item -Force `
  .cursor\templates\react-ts-lint-format-init\SKILL.md `
  .cursor\skills\react-ts-lint-format-init\SKILL.md
```

Bash：

```bash
mkdir -p .cursor/templates .cursor/skills/react-ts-lint-format-init
cp -R <WorkBench>/.cursor/templates/react-ts-lint-format-init .cursor/templates/
cp .cursor/templates/react-ts-lint-format-init/SKILL.md \
  .cursor/skills/react-ts-lint-format-init/SKILL.md
```

然后在对话中让 AI 执行 Skill `react-ts-lint-format-init`（或粘贴 SKILL 内「一键 Prompt」）。  
**真正写入仓库根的配置**由执行流程从 `files/` 复制，不是安装步骤直接覆盖业务仓。

### 可选：一并带走 Cursor format hook 素材

安装 templates 后已含 `optional/cursor-format-hook/`。是否落到 `.cursor/hooks*` 由 Skill 第 5 节决定，**须用户同意**；也可手动：

```powershell
New-Item -ItemType Directory -Force -Path .cursor\hooks | Out-Null
Copy-Item -Force `
  .cursor\templates\react-ts-lint-format-init\optional\cursor-format-hook\format-after-edit.cmd `
  .cursor\hooks\
Copy-Item -Force `
  .cursor\templates\react-ts-lint-format-init\optional\cursor-format-hook\format-after-edit.mjs `
  .cursor\hooks\
# hooks.json：无则复制；有则手动合并 afterFileEdit
Copy-Item -Force `
  .cursor\templates\react-ts-lint-format-init\optional\cursor-format-hook\hooks.json `
  .cursor\hooks.json
```

## 文件清单

```
.cursor/templates/react-ts-lint-format-init/
├── README.md                 # 本说明
├── SKILL.md                  # 执行流程（→ 复制到 .cursor/skills/.../SKILL.md）
├── files/                    # 仓库根配置真源
│   ├── eslint.config.mjs
│   ├── .prettierrc.cjs
│   ├── .prettierignore
│   └── .editorconfig
└── optional/
    └── cursor-format-hook/   # Cursor afterFileEdit（opt-in）
        ├── hooks.json
        ├── format-after-edit.cmd
        └── format-after-edit.mjs
```

## 与项目内已落地配置的关系

| 位置 | 角色 |
|------|------|
| `templates/.../files/` | **跨项目真源**；改规则先改这里 |
| 仓库根 `eslint.config.mjs` 等 | 某项目执行初始化后的落地副本，可含项目特例（额外 ignores 等） |
| `.cursor/hooks/*` | 本仓 Cursor DX；与 `optional/` 同步维护 |

本仓库（WorkBench）若根目录配置与 `files/` 有意不一致（例如忽略 `*.md`），以根目录为准，并在提交说明中写明特例；回写模板时不要静默抹掉可移植默认值。

## 维护

1. 改 ESLint/Prettier/EditorConfig 默认内容 → 只改 `files/`，并视需要同步已落地的仓库根文件。
2. 改执行流程 / 依赖列表 → 改 `SKILL.md`，再复制到 `.cursor/skills/react-ts-lint-format-init/SKILL.md`。
3. 改 Cursor hook → 改 `optional/cursor-format-hook/`，再同步本仓 `.cursor/hooks*`（若在用）。
4. 不要把完整配置再次嵌进 Markdown 代码块作为第二真源。

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-08 | 初版：从 `react-ts-lint-format-init.md` 抽离为 templates 工具包；配置真源 `files/`；可选 Cursor format hook |
