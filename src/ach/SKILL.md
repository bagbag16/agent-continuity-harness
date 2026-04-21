---
name: ach
description: Formal public entry for Agent Continuity Harness. Use when Codex should route a task through the ACH wrapper without requiring the user to choose guard or continuity internals manually. Default for drift-prone, long-running, cross-window, recovery-sensitive, or stateful collaboration tasks; start in guard-mode and enter continuity-mode only when continuity conditions are met.
---

# ACH

## 概要

`ach` 是 `Agent Continuity Harness` 的正式公开入口。
它是这套系统唯一面向用户安装和触发的 skill。

`adg` 与 `cca` 继续保留为内部模块：

- `adg` 承接 `guard-mode`
- `cca` 承接 `continuity-mode`

它们不再作为独立发布物存在，但仍然构成 `ACH` 的内部内核。

## 默认路由

1. 先判断当前任务是否已依赖正式状态根、恢复、绑定、迁移或切窗准备。
2. 若没有，默认进入 `adg`，并按 [guard 规则](./adg/SKILL.md) 的 `guard-mode` 工作。
3. 若有，则进入 `cca`，并按 [continuity 入口规则](./cca/SKILL.md) 的启动协议读取 `.cca-bindings.json` 与当前任务正式状态根。
4. 若当前轮已不再依赖 continuity 操作，且正式状态足以承接后续恢复，则允许回到 `guard-mode`。

## 全称说明

`ACH` 的完整名称是 `Agent Continuity Harness`。
该全称继续保留为产品语义和文档说明，但不再作为第二个独立安装目录发布。

## 入口边界

- `ach` 只负责公开入口、模式选择和最小路由说明
- `adg` 仍是内部 `guard-mode` 核心
- `cca` 仍是内部 `continuity-mode` 核心
- `ach` 不创建第二套正式状态，也不绕过 `.cca-bindings.json` 与 `.cca-state/`
- capability packs 可以增强 `ACH`，但不能改写路由协议或正式状态根规则
