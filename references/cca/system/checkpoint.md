# Checkpoint

当任务到达语义阶段边界、准备审查、面临上下文压力，或需要持久交接点时，读取本文件。

## 权威归属

checkpoint 规则属于 Agent Continuity Harness 这个公开 wrapper。
`guard-mode` 负责识别是否可能需要 checkpoint；`continuity-mode` 负责执行正式状态更新。

`ach` 不得在本文件与正式状态根之外定义第二套 checkpoint 协议。

## 触发条件

以下任一情况成立时，创建或更新 checkpoint：

- 任务发生语义阶段切换，例如问题定义、调研、设计、实现、验证、审查、发布
- 目标、约束、决策、风险边界、文件状态或审批结论会在后续复用
- 工具输出、网页内容、代码片段、审批 transcript 或旧讨论正在挤占活跃判断
- 即将进行高风险操作、权限申请、审查或复核
- 任务需要跨窗口恢复、冷启动、中途接管或交接
- 新信息改变、细化或推翻了仍影响后续工作的旧结论

固定轮数不是 checkpoint 触发器。它只能提醒 agent 检查是否存在语义触发。

## checkpoint 写到哪里

如果已有正式状态根，checkpoint 必须通过对应状态文件或 manifest 写入该状态根。

如果尚无状态根，但 checkpoint 后续会被依赖，应先绑定或创建最小正式状态根。

checkpoint 不是第二套事实源。

## checkpoint 之后

checkpoint 之后，完整历史降级为冷证据。后续默认从以下内容继续：

- 已 checkpoint 的正式状态
- 活跃层文档
- 状态点名的窄来源证据

若要回读完整历史，必须先说明 checkpoint 为什么不足、冲突或需要来源核验。

## 审查薄包

审查、复核和权限敏感流程不应默认继承完整 transcript。

薄包应来自：

- checkpoint 后的状态
- 被审查的具体文件、diff、日志或网页
- 未解决风险与假设

不要因为历史可用，就携带无关历史对话。

## 何时不 checkpoint

简单、一次性、低风险、无未来状态依赖的任务，不强制 checkpoint。

不要为了显得稳定、完整或流程化而 checkpoint。
