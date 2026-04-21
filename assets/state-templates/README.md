# state-templates

这个目录当前承接 `cca` 的状态模板脚手架，不等同运行中的正式状态根。

- skill 根目录存放系统母本
- 本目录提供四件套模板、绑定索引模板与脚手架说明
- 具体任务的运行态正式状态根由 `SYSTEM.md` 的状态容器规则和工作区根 `.cca-bindings.json` 的绑定规则共同决定

当前标准下，最小正式状态根应包含：

- `current-goal.md`
- `confirmed-constraints.md`
- `pending-items.md`
- `decisions.md`
- `state-manifest.json`

当某个任务需要新建正式状态根时，应：

1. 先确认当前任务是否已有可复用的正式状态根
2. 若没有，再在选定的正式状态根位置复制或参考本目录模板
3. 在工作区根 `.cca-bindings.json` 中写入该任务的 `task_key -> formal_state_root` 绑定
4. 参考 `state-manifest.template.json` 创建 `state-manifest.json`
5. 补齐以上 4 个文件与 `state-manifest.json` 后，再进入长期承接
6. 在 `state-manifest.json` 中补齐当前任务的 `task_key`、正式状态根路径、当前模式与完整性状态
7. 若当前任务已经发生显式模式切换，则在 `last_handoff` 中补齐结构化切换记录；若尚未发生显式切换，`last_handoff` 可暂为 `null`

如果当前任务已经存在仍有效的正式状态根，则默认继续沿用，不自动新建第二套四件套。

这些模板可直接参考本目录下的：

- `current-goal.template.md`
- `confirmed-constraints.template.md`
- `pending-items.template.md`
- `decisions.template.md`
- `cca-bindings.template.json`
- `state-manifest.template.json`

其中，运行态绑定索引文件默认位于工作区根目录，文件名为 `.cca-bindings.json`。

`state-manifest.json` 属于正式状态根内部的结构化侧车。
它不替代四件套，也不替代工作区根 `.cca-bindings.json`。

如果模板与正文最低要求不一致，应优先对齐模板与正文，而不是让运行态自行长出影子格式。
