# Agent Continuity Harness（ACH）

本仓库当前对外以正式短名入口 `ach`（`ACH`）组织，并由两个内部 skill 提供核心能力：

- `ach`（`ACH`）：首选公开 wrapper；负责统一入口、模式路由与最小使用心智
- `agent-continuity-harness`：`ACH` 的兼容长名入口；与 `ach` 共享同一套 wrapper 协议
- `agent-drift-guard`（`adg`）：内部 `guard-mode` 核心；负责轻量守卫、漂移控制与升级判断
- `context-continuity-anchor`（`cca`）：内部 `continuity-mode` 核心；负责正式状态、交接与恢复能力

## 如何使用

默认始终从 `ach` 进入；若你已经在旧文档或旧脚本里使用 `agent-continuity-harness`，它仍可继续作为兼容长名入口。

当出现以下情况时，由 `ACH` 通过 `adg` 升级并转入 `cca` 提供的 continuity 模式：

- 任务必须跨多轮、跨窗口或跨新对话继续存在
- 重要状态不应只存活在聊天历史中
- 主要阻塞点与连续性、范围、状态或边界处理有关
- 你需要在中途接管一个已经在运行的讨论

对外默认不要求用户先判断“现在该用 `ACH`、`adg` 还是 `cca`”。
默认先进入 `ACH`，再由系统按当前任务状态决定是留在 `guard-mode` 还是进入 continuity 模式。

## 为什么会有这些 skill

大多数 skill 都是在增加领域知识、工作流或工具使用能力。

这三个 skill 解决的是另一类问题：当失败模式不是能力缺失，而是漂移或连续性断裂时，如何让长时运行协作保持稳定。

- 当问题不在于能力不足，而在于常规多轮工作中发生漂移时，就需要 `agent-drift-guard`。它有助于防止已确认事实、假设、待处理事项和用户意图在无声中彼此混淆。
- 当任务必须在当前聊天之外继续存在时，就需要 `context-continuity-anchor`。它为长任务、跨窗口工作或新对话提供显式的延续、交接与恢复机制。

简而言之：

- 大多数 skill 是帮助 agent 做更多事情
- `ACH` 是默认公开入口和协作 wrapper
- `adg` 是 `ACH` 内部的轻量守卫核心
- `cca` 是 `ACH` 内部的 continuity engine
- 当工作超出仅靠聊天记忆所能承载，或转移到新对话中时，由 `ACH` 路由进入 `cca` 承接正式状态与恢复

## 安装

将这四个文件夹安装到你的 Codex skills 目录下：

- `skills/ach/`
- `skills/agent-continuity-harness/`
- `skills/agent-drift-guard/`
- `skills/context-continuity-anchor/`

当前公开入口与文档简称：

- `ach`：正式短名入口，对外简称 `ACH`
- `agent-continuity-harness`：简称 `ACH`
- `agent-drift-guard`：简称 `adg`
- `context-continuity-anchor`：简称 `cca`

当前不再依赖 alias 机制来实现 `ACH` 唤起。
若要按正式 skill 名显式唤起，优先使用：

- `ach`
- `agent-continuity-harness`
- `agent-drift-guard`
- `context-continuity-anchor`

## 仓库结构

- `skills/ach/`：正式短名公开入口
- `skills/agent-continuity-harness/`：兼容长名 wrapper、模式路由与统一入口说明
- `skills/agent-drift-guard/`：内部 guard 核心、轻量护栏与升级判断
- `skills/context-continuity-anchor/`：内部 continuity engine、系统规则与状态恢复机制

当前仓库中的已发布核心包括 `ACH` 及其依赖的两个内部 skill。
若后续引入设计、研究、写作等专项增强，应优先作为与核心分离的 capability packs 处理，而不是继续把领域规则混写进 `ACH/adg/cca` 正文。

## 发布边界

本仓库不会发布本地工作材料或真实任务状态：

- `refactor-work/` 是仅供本地使用的重构工作区
- `.cca-state/` 与 `.cca-bindings.json` 是本地正式状态与绑定索引

为减少误提交，`.gitignore` 会忽略这些本地状态内容。
