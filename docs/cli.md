# ACH CLI

The ACH CLI makes the continuity contract runnable.

It does not run agents. It creates, validates, and reads formal state roots so
handoff and resume can depend on state instead of chat memory.

## Commands

### `ach init <task-key>`

Create the minimum formal state root and bind it in `.cca-bindings.json`.

```bash
node bin/ach.js init demo-task
```

Creates:

```text
.cca-bindings.json
.cca-state/demo-task/
  current-goal.md
  confirmed-constraints.md
  pending-items.md
  decisions.md
  state-manifest.json
```

Use `--no-bind` only when you need to create files without changing the
workspace binding index.

### `ach bind <task-key> <state-root>`

Bind a task key to an existing state root.

```bash
node bin/ach.js bind demo-task .cca-state/demo-task
```

The state root must stay inside the workspace.

### `ach validate [workspace]`

Validate the workspace binding index and bound state roots.

```bash
node bin/ach.js validate
node bin/ach.js validate examples/fixtures/valid-basic --json
node bin/ach.js validate --task demo-task
```

Validation checks required files, manifest shape, task-key consistency, and
binding consistency.

### `ach checkpoint <task-key>`

Append a controlled checkpoint to one core state file.

```bash
node bin/ach.js checkpoint demo-task --file pending-items --append "Confirm release packaging path."
```

Allowed files:

- `current-goal`
- `confirmed-constraints`
- `pending-items`
- `decisions`

### `ach handoff <task-key>`

Generate a handoff from formal state.

```bash
node bin/ach.js handoff demo-task
```

The output is a derived view. It is not a replacement for the formal state root.

### `ach preflight <task-key>`

Check whether the task is ready to resume.

```bash
node bin/ach.js preflight demo-task
```

`ach resume <task-key>` is an alias with resume-oriented wording.

## Exit Codes

- `0`: state is valid or command completed
- `1`: validation failed or recovery is not ready
- `2`: command usage error

## Dry Run

Write-capable commands support `--dry-run`:

```bash
node bin/ach.js init demo-task --dry-run
node bin/ach.js bind demo-task .cca-state/demo-task --dry-run
node bin/ach.js checkpoint demo-task --file decisions --append "..." --dry-run
```
