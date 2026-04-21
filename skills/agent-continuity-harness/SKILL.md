---
name: agent-continuity-harness
description: 单一公开入口。Use when Codex should route a task through the ACH wrapper instead of requiring the user to choose adg or cca manually. Default for drift-prone, long-running, cross-window, recovery-sensitive, or stateful collaboration tasks; start in guard-mode via agent-drift-guard and escalate to context-continuity-anchor only when continuity conditions are met.
---

# Agent Continuity Harness

## 概要

`ACH` 是当前仓库对外的公开 wrapper。
它是 `adg + cca` 之上的 wrapper，不创建第三套内核，也不替代正式状态机制。

默认情况下，`ACH` 先通过 `adg` 以 `guard-mode` 工作；只有在正式状态、切窗恢复、中途接管或 continuity 治理真正成为当前主问题时，才路由进入 `cca`。

当前正式短名入口是 `ach`；`agent-continuity-harness` 保留为兼容长名入口。

## 默认路由

1. 先判断当前任务是否已依赖正式状态根、恢复、绑定、迁移或切窗准备。
2. 若没有，默认进入 `adg`，并按 [agent-drift-guard/SKILL.md](../agent-drift-guard/SKILL.md) 的 `guard-mode` 工作。
3. 若有，则进入 `cca`，并按 [context-continuity-anchor/SKILL.md](../context-continuity-anchor/SKILL.md) 的启动协议读取 `.cca-bindings.json` 与当前任务正式状态根。
4. 若当前轮已不再依赖 continuity 操作，且正式状态足以承接后续恢复，则允许回到 `guard-mode`。

## 何时使用 ACH

- 你想要单一入口，而不想手动判断 `adg` 还是 `cca`
- 任务会跨多轮、跨窗口或跨新对话继续
- 当前讨论容易漂移，且后续推进依赖高影响状态
- 当前任务需要恢复、交接、中途接管或正式状态治理
- 当前任务本身正在维护 `ACH / adg / cca` 的规则、边界或状态机制
- 你在文档或讨论里已经把这套系统简称为 `ACH`

## 入口边界

- `ACH` 只负责公开入口、模式选择和最小路由说明
- `adg` 仍是内部 `guard-mode` 核心
- `cca` 仍是内部 `continuity-mode` 核心
- `ACH` 不创建第二套正式状态，也不绕过 `.cca-bindings.json` 与 `.cca-state/`
- capability packs 可以增强 `ACH`，但不能改写路由协议或正式状态根规则

## 最低切换要求

当 `ACH` 发生模式切换时，最低应保留：

- `direction`
- `reason`
- `task`
- `stage`
- `state_basis`
- `next_mode`

若当前任务已绑定正式状态根，这些信息应优先进入该任务的正式状态文件或 `state-manifest.json`，而不是只留在自然对话中。

## 直接使用内部 skill 的例外

- 用户明确指定只用 `adg`
- 用户明确指定只用 `cca`
- 当前工作纯粹是在维护内部核心，而不是走 ACH 公开入口
- 当前验证任务要求分别检查 wrapper、guard 核心和 continuity 核心

除此以外，默认从 `ACH` 进入。
