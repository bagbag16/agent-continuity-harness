# instances

这个目录用于承接 `cca` 的任务实例状态。

- skill 根目录存放系统母本
- `instances/<task-name>/` 存放某个具体任务的状态副本
- 正式状态只进入实例目录，不写回母本

最小实例骨架为：

- `current-goal.md`
- `confirmed-constraints.md`
- `pending-items.md`
- `decisions.md`

首次进入 `cca` 且当前任务还没有实例目录时，应先创建一个实例目录，再补齐以上 4 个文件的最小模板。

如果当前任务已经存在仍有效的实例目录，则默认继续沿用该实例，而不是自动新建。

这些文件的模板可直接参考本目录下的：

- `current-goal.template.md`
- `confirmed-constraints.template.md`
- `pending-items.template.md`
- `decisions.template.md`
