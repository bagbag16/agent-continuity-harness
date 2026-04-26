# 状态根

当当前决策依赖正式状态根发现、复用、创建、绑定、manifest 字段或绑定冲突处理时，读取本文件。

## 单一正式状态根

一个任务只应有一个 active 正式状态根。

已有有效绑定状态根时，不得默认新建状态根。除非任务身份真正改变，否则应更新或修复现有状态根。

## 绑定索引

工作区根 `.cca-bindings.json` 是 `task_key -> formal_state_root` 的 canonical 索引。

它应回答：

- 当前 active 的 task key 是什么
- 正式状态根在哪里
- 某个状态根是否已被替代
- 当前绑定是否健康到足以恢复

如果 `.cca-bindings.json` 已提供有效绑定，不要再从目录名推断另一套状态根。

## 正式状态根

正式状态根通常位于 `.cca-state/<task>/`，包含：

- `current-goal.md`
- `confirmed-constraints.md`
- `pending-items.md`
- `decisions.md`
- `state-manifest.json`

四个 markdown 文件承接人类可读恢复状态。manifest 是 machine-readable 侧车，不替代四件套。

## `state-manifest.json`

最低字段：

```json
{
  "task_key": "",
  "formal_state_root": "",
  "active_mode": "guard-mode | continuity-mode",
  "active_layer": "inner | outer | system",
  "active_packs": [],
  "last_handoff": null,
  "superseded_roots": [],
  "integrity_status": "ok | needs-normalization | incomplete | binding-conflict | shadow-copy-suspected"
}
```

manifest 用于结构化发现、校验和路由元数据。
markdown 状态文件用于记录决策内容。

## 复用规则

以下条件成立时复用现有状态根：

- `.cca-bindings.json` 指向该状态根
- 状态根存在
- task key 仍描述当前任务
- 四件套存在或可修复
- 没有更新的 active 状态根替代它

只有无有效状态根，或旧状态根已被明确 supersede 时，才创建新状态根。

## 冲突处理

如果两个状态根都声称自己是同一任务的 active 根：

1. 停止同时把两者当 active
2. 识别绑定来源、时间戳和最后有意义状态
3. 只有证据支持时才选择一个 active 根
4. 将另一个标记为 superseded、rejected 或历史证据
5. 在 `decisions.md` 与 manifest 中记录决定

不得静默合并状态根。合并前必须保留来源身份和冲突原因。

## 临时与派生状态

临时工作区和派生视图可以辅助执行，但除非其内容经 `outer.md` 规则升格进正式状态根，否则不作为正式恢复源。
