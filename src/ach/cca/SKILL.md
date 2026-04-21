---
name: context-continuity-anchor
description: 内部 continuity engine。默认由 ach 在命中 continuity 条件后路由进入；通常经由 adg 的 guard-mode 升级而来，负责分层判断、状态治理与承接恢复。Use directly only when the user explicitly wants cca or the task itself is maintaining continuity rules, state roots, or recovery.
---

# Context Continuity Anchor

## 入口定位

`cca` 是 `ACH` 背后的 continuity engine，而不是默认公开入口。

它默认由 `ACH` 在以下情形路由进入：

- 任务需要正式状态承接
- 任务需要跨窗口或跨新对话恢复
- 任务需要中途接管自检
- 轻量守卫已不足以维持稳定推进

只有在以下情况中，才适合直接进入 `cca`：

- 用户明确指定要使用 `cca`
- 当前工作本身就是 continuity 规则、状态根或恢复机制审查
- 当前窗口正在恢复或维护一个已绑定的正式状态根

## 顶层表达

- 行为轴：`INNER`、`OUTER`
- 状态容器轴：系统母本、正式任务状态、临时工作区、派生视图

## 默认原则

- 默认依赖最小启动包
- 先按 `INNER` 工作
- 需要稳定承接时进入 `OUTER`
- 系统级入口协议与容器政策以 `SYSTEM.md` 为准

## 默认启动协议

当 `cca` 被触发时，默认不直接凭印象展开整套系统，也不默认全文回读所有母本文档。

默认启动顺序应为：

1. 先读 `SYSTEM.md`
2. 先按 `SYSTEM.md` 的发现与绑定协议，通过工作区根 `.cca-bindings.json` 或首次绑定输入确认当前任务的正式状态根
3. 若当前任务已有已绑定的正式状态根，按以下顺序读取正式状态：
   - `current-goal.md`
   - `confirmed-constraints.md`
   - `pending-items.md`
   - `decisions.md`
4. 根据 `current-goal.md` 判断当前活跃层
5. 只读取当前活跃层所需的层文档
6. 仅当最小启动包不足以支撑当前判断时，再按需补读其他母本文档

若当前尚未绑定正式状态根，或已绑定的正式状态文件不存在，则按 `SYSTEM.md` 的首次绑定规则工作，给出最小必要说明后再继续推进。

## 系统职责

`cca` 不是普通对话的默认宿主，而是复杂、多轮、长链路任务中的内部重型协作系统。

它负责：

- 判断当前问题应继续在对话内收束，还是进入正式状态治理
- 稳定承接高影响状态
- 在需要时做中途接管自检
- 为跨轮、跨窗口继续提供恢复基座
