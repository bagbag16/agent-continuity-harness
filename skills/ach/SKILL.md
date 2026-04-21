---
name: ach
description: Formal short-name public entry for Agent Continuity Harness. Use when Codex should route a task through the ACH wrapper via the short invocation name instead of requiring the user to choose adg or cca manually. Default for drift-prone, long-running, cross-window, recovery-sensitive, or stateful collaboration tasks; start in guard-mode via agent-drift-guard and escalate to context-continuity-anchor only when continuity conditions are met.
---

# ACH

## 概要

`ach` 是 `Agent Continuity Harness` 的正式短名 skill，也是当前推荐的公开入口。
它与 `agent-continuity-harness` 代表同一个 wrapper；区别只在于：

- `ach` 是首选短名入口
- `agent-continuity-harness` 保留为兼容长名入口

两者都不创建第三套内核，也都不替代正式状态机制。

## 默认路由

1. 先判断当前任务是否已依赖正式状态根、恢复、绑定、迁移或切窗准备。
2. 若没有，默认进入 `adg`，并按 [agent-drift-guard/SKILL.md](../agent-drift-guard/SKILL.md) 的 `guard-mode` 工作。
3. 若有，则进入 `cca`，并按 [context-continuity-anchor/SKILL.md](../context-continuity-anchor/SKILL.md) 的启动协议读取 `.cca-bindings.json` 与当前任务正式状态根。
4. 若当前轮已不再依赖 continuity 操作，且正式状态足以承接后续恢复，则允许回到 `guard-mode`。

## 共享协议

`ach` 与 `agent-continuity-harness` 共享同一套 wrapper 协议。
需要更完整的公开入口说明时，直接遵循 [agent-continuity-harness/SKILL.md](../agent-continuity-harness/SKILL.md)。

## 入口边界

- `ach` 只负责公开入口、模式选择和最小路由说明
- `adg` 仍是内部 `guard-mode` 核心
- `cca` 仍是内部 `continuity-mode` 核心
- `ach` 不创建第二套正式状态，也不绕过 `.cca-bindings.json` 与 `.cca-state/`
- capability packs 可以增强 `ACH`，但不能改写路由协议或正式状态根规则
