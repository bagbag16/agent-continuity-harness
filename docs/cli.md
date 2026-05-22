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

### `ach list`

List bound ACH tasks in a workspace and summarize their validation state.

```bash
node bin/ach.js list
node bin/ach.js tasks --json
node bin/ach.js list examples/fixtures/valid-basic --json
```

`tasks` is an alias for `list`.

`list` is for discovery and exits successfully when the binding index can be
read, even if some old tasks are invalid. Use `ach health` when invalid tasks
should fail the command.

### `ach health`

Run a strict workspace-level health check across all bound tasks.

```bash
node bin/ach.js health
node bin/ach.js health --json
```

Unlike `list`, this command exits with code `1` when any bound task is invalid.

### `ach validate [workspace]`

Validate the workspace binding index and bound state roots.
Validation reads the public schemas under `schemas/` first, then checks the
task-level recovery rules that schemas cannot express.

```bash
node bin/ach.js validate
node bin/ach.js validate examples/fixtures/valid-basic --json
node bin/ach.js validate --task demo-task
```

Validation checks schema shape, required files, manifest task-key consistency,
binding consistency, manifest-listed supplemental documents, active-context
minimum structure, and manifest-listed built-in validators.

Built-in validators check recovery integrity only. They do not execute
state-root scripts, regenerate artifacts, or decide whether project-domain
outputs such as simulations, scoring, or numeric designs are correct.

When `--task <task-key>` is provided, validation is scoped to that task's
binding and formal state root. Unrelated bindings in the same workspace are not
allowed to block task recovery. Running `ach validate` without `--task` still
validates the full binding index.

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

### `ach record <task-key>`

Append a structured record to the appropriate core file.

```bash
node bin/ach.js record demo-task --type pending --text "Confirm release tag."
node bin/ach.js record demo-task --type decision --text "Use compact handoff by default." --basis "Dogfood showed full handoff is too noisy."
```

Supported types are `decision`, `constraint`, `pending`, and `goal`. This is a
controlled append helper; it does not rewrite prior state or decide whether a
claim should be promoted.

### `ach status <task-key>`

Extract a machine-readable recovery/status view for a bound task.

```bash
node bin/ach.js status demo-task --json
node bin/ach.js status demo-task --brief
```

This command is intended primarily for agents and skills. It returns validation
state, current route, active artifacts, blockers, read-next information, and a
bounded recovery-core view. In Codex usage, the ACH skill should render this
payload into a user-facing status answer instead of showing raw state mechanics.

`--brief` prints one short status line for quick terminal or agent checks.

### `ach check-write <task-key>`

Check whether durable state writes are connected to future recovery.

```bash
node bin/ach.js check-write demo-task --json
```

This complements `ach validate`. Validation checks state-root integrity;
`check-write` checks write-to-use closure risks such as active context outside
the default read path, active artifacts that are not indexed, inactive active
artifacts, route/mouth mismatches, and missing artifact-index validators.

### `ach handoff <task-key>`

Generate a compact handoff from formal state.

```bash
node bin/ach.js handoff demo-task
node bin/ach.js handoff demo-task --full
```

The output is a derived view. It is not a replacement for the formal state root.
By default, handoff output is compact. When a manifest-declared default-read
`active-context` document exists, compact handoff prioritizes its semantic
sections such as current route, active rules, active artifacts, diagnostic
history, blockers, and read order. Otherwise it falls back to bounded recovery
core excerpts. Compact handoff always lists manifest-declared supplemental
documents.

Use `--full` when an agent needs the complete derived handoff view. Use `--json`
when another tool needs the unrendered payload.

`--compact` is accepted for explicitness, but compact mode is already the
default. Do not combine `--compact` and `--full`.

### `ach preflight <task-key>`

Check whether the task is ready to resume.

```bash
node bin/ach.js preflight demo-task
```

`ach resume <task-key>` is an alias with resume-oriented wording.

### `ach pause <task-key>`

Produce a compact pause package from current formal state.

```bash
node bin/ach.js pause demo-task
node bin/ach.js pause demo-task --json
```

This combines `status`, `check-write`, and compact handoff generation. It does
not replace the formal state root.

### `ach add-supplemental <task-key>`

Create and register a standard supplemental document.

```bash
node bin/ach.js add-supplemental demo-task --role active-context
node bin/ach.js add-supplemental demo-task --role artifact-provenance-index --json
```

Supported roles are `active-context`, `branch-attempt-ledger`,
`artifact-provenance-index`, `state-relation-index`, and `compiled-lineage`.
The command writes the markdown template when the document does not exist and
updates `state-manifest.json`. For `artifact-provenance-index`, it also
registers a built-in `artifact-index` validator unless `--no-validator` is
provided.

### `ach artifact check <task-key>`

Validate the registered artifact provenance index directly.

```bash
node bin/ach.js artifact check demo-task --json
```

This is a targeted version of artifact validation for agent workflows. It does
not regenerate artifacts or judge project-domain correctness.

### `ach artifact add <task-key>`

Append one artifact entry to the task's artifact provenance index.

```bash
node bin/ach.js artifact add demo-task --path outputs/chart.png --kind chart --produced-by simulator --mouth current --json
```

If no artifact provenance index exists, the command creates and registers the
standard index first. Optional fields include `--id`, `--status`,
`--valid-when`, `--invalid-when`, `--replacement`, `--depends-on`, and
`--source-paths`. Comma-separate multiple dependency or source-path values.

### `ach repair <task-key> --safe`

Apply only safe, mechanical repair actions.

```bash
node bin/ach.js repair demo-task --safe
node bin/ach.js repair demo-task --safe --dry-run --json
```

Safe repairs can register or create a missing `active-context` switchboard when
supplemental documents already exist, put active-context back into the default
read path, mark it as recovery-blocking, register missing artifact-index
validators, and connect artifact validators to active-context. It does not
rewrite user decisions, constraints, pending items, or project-domain content.

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
