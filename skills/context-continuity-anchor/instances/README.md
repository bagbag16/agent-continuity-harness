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
