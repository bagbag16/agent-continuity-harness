# Capability Packs

当评估或激活 ACH 可选 capability packs 时，读取本文件。

## 边界

capability packs 可以增加领域流程、例子、工具或复核标准。

它们不得改写：

- 公开入口路由
- `guard-mode` / `continuity-mode` 边界
- `.cca-bindings.json`
- 正式状态根规则
- 恢复源权威

## 何时使用 pack

只有当某个 pack 为当前任务提供了 core ACH 不具备的具名能力时，才使用它。

不得因为 pack 存在、以后可能有用、或让系统看起来更完整而加载。

## 激活记录

如果某个 pack 会影响后续多轮判断，应记录：

- pack 名称
- 激活原因
- 作用范围
- 预计持续时间
- 可能影响的状态文件或输出
- 退出条件

如果任务是局部的，且 pack 不产生持久影响，聊天内轻量说明即可。

## core 与 pack

稳定系统不变量留在 core。

领域性、可选性或频繁变化的流程进入 pack。

如果某个候选 pack 开始定义路由、恢复或状态根权威，它就不是 pack，而是在修改内核，必须进入单独设计评审。
