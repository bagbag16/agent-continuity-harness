# Agent Continuity Harness（ACH）

本仓库当前对外发布的是一个单 skill 产物：`ach`（`ACH`）。

内部能力仍然分成两个模块：

- `agent-drift-guard`（`adg`）：内部 `guard-mode` 核心；负责轻量守卫、漂移控制与升级判断
- `context-continuity-anchor`（`cca`）：内部 `continuity-mode` 核心；负责正式状态、交接与恢复能力

## 如何使用

默认始终从 `ach` 进入。
对用户而言，不再需要分别安装 `adg`、`cca` 或 `agent-continuity-harness`。

当出现以下情况时，由 `ACH` 通过 `adg` 升级并转入 `cca` 提供的 continuity 模式：

- 任务必须跨多轮、跨窗口或跨新对话继续存在
- 重要状态不应只存活在聊天历史中
- 主要阻塞点与连续性、范围、状态或边界处理有关
- 你需要在中途接管一个已经在运行的讨论

对外默认不要求用户先判断“现在该用 `ACH`、`adg` 还是 `cca`”。
默认先进入 `ACH`，再由系统按当前任务状态决定是留在 `guard-mode` 还是进入 continuity 模式。

## 为什么会有这些 skill

大多数 skill 都是在增加领域知识、工作流或工具使用能力。

这套系统解决的是另一类问题：当失败模式不是能力缺失，而是漂移或连续性断裂时，如何让长时运行协作保持稳定。

- 当问题不在于能力不足，而在于常规多轮工作中发生漂移时，就需要 `agent-drift-guard`。它有助于防止已确认事实、假设、待处理事项和用户意图在无声中彼此混淆。
- 当任务必须在当前聊天之外继续存在时，就需要 `context-continuity-anchor`。它为长任务、跨窗口工作或新对话提供显式的延续、交接与恢复机制。

简而言之：

- 大多数 skill 是帮助 agent 做更多事情
- `ACH` 是唯一公开入口和协作 wrapper
- `adg` 是 `ACH` 内部的轻量守卫模块
- `cca` 是 `ACH` 内部的 continuity 模块
- 当工作超出仅靠聊天记忆所能承载，或转移到新对话中时，由 `ACH` 路由进入 `cca` 承接正式状态与恢复

## 安装

安装 `dist/ach/` 到你的 Codex skills 目录下即可。

当前安装名和简称如下：

- `ach`：正式短名入口，对外简称 `ACH`
- `Agent Continuity Harness`：`ACH` 的全称，用于文档和产品语义
- `adg`：内部 guard 模块名
- `cca`：内部 continuity 模块名

## 仓库结构

- `src/ach/`：唯一源码真源
- `src/ach/adg/`：内部 guard 模块源码
- `src/ach/cca/`：内部 continuity 模块源码
- `dist/ach/`：唯一对外发布产物
- `scripts/build-ach-bundle.ps1`：从 `src/ach` 生成 `dist/ach`
- `scripts/validate-ach-bundle.ps1`：校验 `dist/ach` 是否为合法单 skill 产物
- `scripts/validate-ach-repo.ps1`：串联源码、构建与 bundle 校验
- `scripts/check-cca-state.ps1`：单独校验本地 `.cca-state/` 与 `.cca-bindings.json`

当前仓库中的已发布核心只有 `ACH`。
若后续引入设计、研究、写作等专项增强，应优先作为与核心分离的 capability packs 处理，而不是继续把领域规则混写进 `ACH/adg/cca` 正文。

## 开发流程

默认开发顺序：

1. 修改 `src/ach/...`
2. 运行 `scripts/build-ach-bundle.ps1`
3. 运行 `scripts/validate-ach-bundle.ps1`
4. 需要仓库发布校验时，运行 `scripts/validate-ach-repo.ps1`
5. 需要校验本地正式状态时，再单独运行 `scripts/check-cca-state.ps1`

`dist/ach/` 是构建产物，不应手工维护。

## 发布边界

本仓库只发布单 skill 产物、模板脚手架与通用校验脚本。

本地任务状态、绑定索引、重构工作材料与个人开发器配置不纳入版本库，并由 `.gitignore` 忽略。
