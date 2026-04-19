# 面向长时运行代理的漂移防护与交接技能

本仓库发布了两个用于稳定、长时运行 AI 协作的 Codex skill：

- `agent-drift-guard`（`adg`）：为常规多轮工作提供轻量护栏
- `context-continuity-anchor`（`cca`）：为必须在当前聊天之外继续存在的工作提供有状态的延续、交接与恢复能力

## 如何使用

默认使用 `agent-drift-guard`。

在以下情况切换到 `context-continuity-anchor`：

- 任务必须跨多轮、跨窗口或跨新对话继续存在
- 重要状态不应只存活在聊天历史中
- 主要阻塞点与连续性、范围、状态或边界处理有关
- 你需要在中途接管一个已经在运行的讨论

## 为什么会有这些 skill

大多数 skill 都是在增加领域知识、工作流或工具使用能力。

这两个 skill 解决的是另一类问题：当失败模式不是能力缺失，而是漂移或连续性断裂时，如何让长时运行协作保持稳定。

- 当问题不在于能力不足，而在于常规多轮工作中发生漂移时，就需要 `agent-drift-guard`。它有助于防止已确认事实、假设、待处理事项和用户意图在无声中彼此混淆。
- 当任务必须在当前聊天之外继续存在时，就需要 `context-continuity-anchor`。它为长任务、跨窗口工作或新对话提供显式的延续、交接与恢复机制。

简而言之：

- 大多数 skill 是帮助 agent 做更多事情
- `adg` 是帮助 agent 在做事时保持对齐
- 当工作超出仅靠聊天记忆所能承载，或转移到新对话中时，`cca` 能帮助 agent 连贯地继续推进

## 安装

将这两个文件夹安装到你的 Codex skills 目录下：

- `skills/agent-drift-guard/`
- `skills/context-continuity-anchor/`

调用别名：

- `agent-drift-guard` -> `adg`
- `context-continuity-anchor` -> `cca`

## 仓库结构

- `skills/agent-drift-guard/`：轻量护栏与升级路由
- `skills/context-continuity-anchor/`：系统规则、分层延续模型与实例脚手架

## 发布边界

本仓库不会发布本地工作材料：

- `refactor-work/` 是仅供本地使用的重构状态
- `personal-design-portrait` 这类真实本地实例不属于已发布的 skill 集合

为减少误提交，`.gitignore` 会忽略 `refactor-work/`。
