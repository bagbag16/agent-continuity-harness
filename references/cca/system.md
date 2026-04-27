# CCA 系统索引

本文件是 `cca` 的轻量系统入口。

它不是完整 continuity 规则正文。默认启动只先读本文件，然后只读取当前判断需要的状态文件、活跃层文档或专题细则。

## 用途

`cca` 是 Agent Continuity Harness 背后的内部 continuity engine。
当 `guard-mode` 已不足以稳定承接时，它负责正式状态、恢复、交接、跨窗口延续和状态根治理。

本文件只回答：

- `cca` 负责什么
- 哪类系统决策由哪个文件负责
- 最小启动路径是什么
- 什么时候展开到专题细则文件

## 两轴结构

行为轴：

- `inner`：同窗口收束、必要外化检测、对话内冲突处理
- `outer`：正式状态写入判断、状态效力规则、状态文件治理

状态容器轴：

- 系统母本：`references/cca/` 与 `references/cca/system/`
- 正式任务状态根：`.cca-state/<task>/`
- 临时工作区：不作为恢复源的草稿与中间材料
- 派生视图：从正式状态生成的摘要、计划、检查表

当判断依赖容器边界时，读取 [system/containers.md](./system/containers.md)。

## 默认启动路径

1. 读取本索引。
2. 通过工作区根 `.cca-bindings.json` 发现或绑定当前正式状态根。
3. 若存在有效状态根，只读取：
   - `current-goal.md`
   - `confirmed-constraints.md`
   - `pending-items.md`
   - `decisions.md`
4. 用 `current-goal.md` 判断当前活跃层。
5. 只读取当前活跃层文档：
   - [inner.md](./inner.md)：同窗口收束
   - [outer.md](./outer.md)：正式状态治理
6. 只有当前决策命中明确触发时，才读取一个专题细则文件。

若需要绑定、恢复或启动规则，读取 [system/startup-and-recovery.md](./system/startup-and-recovery.md)。

若需要状态根选择、复用、manifest 或绑定冲突规则，读取 [system/state-roots.md](./system/state-roots.md)。

## 专题索引

- [system/startup-and-recovery.md](./system/startup-and-recovery.md)：启动预算、首次绑定、恢复、交接摘要、跨窗口延续。
- [system/state-roots.md](./system/state-roots.md)：单一正式状态根、`.cca-bindings.json`、`.cca-state/<task>/`、`state-manifest.json`、复用和绑定冲突。
- [system/routing.md](./system/routing.md)：ACH / guard-mode / continuity-mode 路由、升级、回退和切换记录。
- [system/checkpoint.md](./system/checkpoint.md)：语义 checkpoint、阶段边界、审查薄包和不应 checkpoint 的情况。
- [system/containers.md](./system/containers.md)：系统母本、正式状态、临时工作区、派生视图，以及行动规则与复核规则归属。
- [system/capability-packs.md](./system/capability-packs.md)：可选 capability pack 的边界、激活记录和内核限制。

## 展开规则

不得为了“更稳”一次性读取全部专题文件。

只有以下情况之一成立时才展开：

- 本索引、四件套和活跃层文档不足以支撑当前判断
- 用户要求审查或修改该系统部分
- 当前存在绑定、恢复、路由、checkpoint 或容器冲突
- 活跃层文档或当前任务明确点名某个专题文件

展开时，只读拥有当前决策的最小专题文件。不要因为相邻主题有关联就顺手加载。

读取专题文件后，只输出当前决策所需的最小摘要。除非任务本身是在审阅原文，否则不要把长段规则重新搬进对话。

## 负载原则

轻量不是删除必要结构，而是让默认可见层足够小，并保留必要背景的按需展开与来源追溯。

token、读取量和启动延迟都是系统设计成本。不得用“多读一点更稳”替代状态修复、专题路由或最小证据读取。

系统应吸收必要的调用、读取、切换和恢复成本；不得把这些成本默认转嫁给用户手工长交接、反复说明或整段历史阅读。

## 硬边界

- `cca` 不是默认公开入口。Agent Continuity Harness 是正式项目名；`ach` 是调用缩写。
- `guard-mode` 与 `continuity-mode` 是 ACH 内部模式。普通用户不应被要求手动选择内部模块。
- `cca` 不得在 `.cca-bindings.json` 和正式状态根之外创建第二套状态协议。
- 交接摘要、checkpoint 或派生计划都不能替代正式状态。
- 恢复上下文缺失时，优先修复状态，而不是扩大文档读取范围。
- 属于 `inner.md` 或 `outer.md` 的规则，不在本文件重复定义；本文件只负责路由到正确文件。

## 最小完成检查

离开 `continuity-mode` 前确认：

- 当前正式状态根已知，或已明确不需要正式状态根
- 当前目标、确认约束、未决项和决策没有混写
- 后续会依赖的路由切换或 checkpoint 已被记录
- 本轮读取的专题细则产出了决策，而不是只增加上下文
- 后续恢复可从本索引、状态文件和活跃层文档开始，而不需要重读整套系统
