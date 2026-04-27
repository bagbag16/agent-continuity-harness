# ACH 架构分支图

本文件记录 ACH 的关键分支、分叉原因和当前选择。
它不是任务清单，也不是完整历史；只记录会影响后续架构判断的分叉。

## 记录格式

每个分支至少说明：
- 分支对象：讨论的是哪一层、哪条能力线或哪类产物
- 当前选择：现在以什么方案为准
- 选择原因：为什么这样分，而不是保留混合状态
- 替代路径：曾经或可能存在的其他方案
- 当前状态：`active`、`pending`、`superseded` 或 `rejected`
- 约束引用：若该分支有表达、复杂度、可读性或产品化约束，指向 `design-constraints.md`

## 当前分支树

```text
ACH
├─ public entry
│  └─ active: 对外以 Agent Continuity Harness / agent-continuity-harness 为正式项目名；调用入口使用 ach；ADG/CCA 是内部模式，不作为普通用户选择
├─ guard-mode
│  └─ active: 处理窗口内漂移、边界稳定、最小读回和轻量外化建议
├─ continuity-mode
│  └─ active: 处理正式状态、恢复、交接、跨窗口延续和状态根治理
├─ state governance
│  ├─ active: current-goal / confirmed-constraints / pending-items / decisions 四件套
│  ├─ active: 新旧状态必须区分 active / pending / superseded / rejected
│  ├─ active: 外化以必要性为门槛，不以完整感为目标
│  └─ active: 外化完成以正式状态可回读为准，不以对话总结或交接摘要为准
├─ cca system loading
│  └─ active: system.md 只作为轻量索引；细则拆入 references/cca/system/ 并按触发读取
├─ operating cost
│  └─ active: token、读取量、启动延迟和用户手工交接都视为设计成本
├─ same-window continuation
│  └─ pending: 先解决窗口内对话反复全盘阅读与必要内容外化，再扩展到 handoff
├─ handoff continuation
│  └─ pending: 只能基于已外化状态压缩生成，不能替代正式状态
└─ GitHub productization
   └─ active: 用高星项目结构提升可理解性、可信度和可安装性，但不拆散 ACH 的单一产品身份
```

## 分叉选择原因

### public entry

选择 Agent Continuity Harness 作为正式项目名、`ach` 作为调用缩写，是为了同时满足 GitHub 展示可读性和日常调用低成本。
ADG/CCA 保留为内部模式，是因为它们解决的是不同运行层级的问题，但不需要用户在普通使用时手动选择。

### guard-mode 与 continuity-mode

guard-mode 解决“当前窗口内如何不漂移”的问题。
continuity-mode 解决“状态如何正式承接、恢复和跨窗口延续”的问题。

两者分开，是因为轻量漂移控制不应强迫每个任务进入正式状态；正式状态也不应被对话内临时判断污染。

### same-window continuation 与 handoff continuation

同窗口连续推进优先，因为许多浪费先发生在当前对话内：重复全盘阅读、必要内容没有及时升格、旧结论和新结论关系不清。
handoff 应建立在同窗口状态治理稳定之后，否则交接摘要会继承混乱。

### state governance

四件套保持为最小正式状态结构。
新增效力状态不是增加一套状态系统，而是让每条记录说明“现在怎么读它”：当前有效、待确认、已替代或已拒绝。

### cca system loading

`references/cca/system.md` 不再承接全量系统正文，只承接索引、默认启动顺序和 topic map。
详细规则放入 `references/cca/system/` 下的专题文件，并且只有在绑定、恢复、路由、checkpoint、容器或 capability pack 等具体触发出现时读取。
这样保留可追溯细则，同时降低默认 token 成本和启动延迟。

## 更新规则

只有当分支选择会影响后续架构、文档、规则或用户恢复路径时，才更新本文件。
普通实现细节、一次性表达调整和临时讨论不进入本文件。
