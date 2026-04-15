---
name: context-continuity-anchor
alias: cca
description: 复杂多轮任务的重型协作系统；负责分层判断、状态治理与承接恢复。
---

# Context Continuity Anchor

## 组成

- `SYSTEM`
- `INNER`
- `OUTER`
- `DOER`（当前仅占位）

## 默认原则

- 默认依赖最小启动包
- 先按 `INNER` 工作
- 需要稳定承接时进入 `OUTER`
- `DOER` 当前只保留占位，不展开执行体系

## 默认启动协议

当 `cca` 被触发时，默认不直接凭印象展开整套系统，也不默认全文回读所有母本文档。

默认启动顺序应为：

1. 先读 `SYSTEM.md`
2. 若当前任务已有实例目录，按以下顺序读取实例状态：
   - `current-goal.md`
   - `confirmed-constraints.md`
   - `pending-items.md`
   - `decisions.md`
3. 根据 `current-goal.md` 判断当前活跃层
4. 只读取当前活跃层所需的层文档
5. 仅当最小启动包不足以支撑当前判断时，再按需补读其他母本文档

若当前不存在任务实例状态文件，则按 `SYSTEM.md` 的首次进入规则工作，给出最小必要说明后再继续推进。

## 定位

`cca` 不是普通对话的默认宿主，而是复杂、多轮、长链路任务的重型协作系统。

它负责：

- 完整判断当前问题应在哪一层处理
- 稳定承接高影响状态
- 在需要时做中途接管自检
- 为跨轮、跨窗口继续提供恢复基座
