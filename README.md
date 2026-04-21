# Agent Continuity Harness (ACH)

这个仓库本身就是 **ACH 的直接安装版本**。

如果你只是想下载并使用 ACH，不需要再区分源码、构建脚本或额外分支。  
仓库根目录里的这些内容就是最终安装内容：

- `SKILL.md`
- `agents/`
- `references/`
- `assets/`

## 如何安装

把这个仓库下载下来后，将仓库根目录作为一个 skill 目录放入你的 Codex skills 目录，并命名为 `ach`。

安装后的结构应当直接从这些文件开始：

- `SKILL.md`
- `agents/openai.yaml`
- `references/adg/...`
- `references/cca/...`
- `assets/state-templates/...`

## 这是什么

`ACH` 的完整名称是 `Agent Continuity Harness`。

它是一个单入口协作 skill，用来承接：

- 长任务
- 跨窗口继续
- 中途接管
- 对恢复、连续性和状态边界更敏感的协作

默认从 `ach` 进入，再由系统内部判断是留在 `guard-mode`，还是进入 `continuity-mode`。

## 内部结构

虽然对外只安装一个 skill，但内部仍然保留两层能力：

- `adg`：轻量守卫层，负责漂移控制、边界判断和升级信号
- `cca`：continuity 层，负责正式状态、恢复、交接与延续承接

你不需要单独安装它们；它们已经包含在这个仓库里。

## 适合什么时候用

如果你的任务：

- 不想在多轮对话里慢慢漂掉
- 需要跨聊天或跨窗口继续
- 需要把关键状态挂住，而不是只留在聊天历史里
- 可能中途交接或稍后恢复

那就直接用 `ACH`。
