# ACH State Contract

The ACH state contract is the minimum structure required to recover a
long-running task from formal state instead of chat memory.

ACH keeps the current MVP-compatible filesystem names:

- workspace binding index: `.cca-bindings.json`
- formal state root: `.cca-state/<task-key>/`

These names are compatibility mechanics. Public documentation can describe them
as the ACH formal state root. Do not introduce a second state protocol.

## Workspace Binding Index

`.cca-bindings.json` maps task keys to formal state roots.

```json
{
  "version": 1,
  "bindings": {
    "demo-task": {
      "formal_state_root": ".cca-state/demo-task"
    }
  }
}
```

Rules:

- one task key has one canonical formal state root
- paths must stay inside the workspace
- binding changes must be explicit
- derived handoff summaries must not become bindings

## Formal State Root

Each formal state root must contain:

- `current-goal.md`
- `confirmed-constraints.md`
- `pending-items.md`
- `decisions.md`
- `state-manifest.json`

The four markdown files are the human-readable recovery core. The manifest is
machine-readable metadata for discovery and validation.

## State File Responsibilities

`current-goal.md` records:

- current task axis
- current phase
- next step
- out-of-scope boundaries when needed

`confirmed-constraints.md` records:

- constraints that are confirmed and still active
- naming, scope, priority, or compatibility rules
- an explicit empty state when there are no active constraints

`pending-items.md` records:

- important unresolved items
- impact scope
- whether each item blocks progress
- provisional continuation when it does not block

`decisions.md` records:

- decisions the next session should inherit
- superseded or rejected paths when they prevent repeated drift
- pointers to supplemental documents when details are too large for the core

## Manifest

`state-manifest.json` records:

- `task_key`
- `formal_state_root`
- `active_mode`
- `active_packs`
- optional `supplemental_documents`
- `last_handoff`
- `superseded_roots`
- `integrity_status`

Supplemental documents are not core state files. They are indexed references
that should be read only when their `read_when` condition applies.

## Validation

Run:

```bash
ach validate
```

or machine-readable:

```bash
ach validate --json
```

Validation fails when:

- `.cca-bindings.json` is missing or invalid
- a bound state root is missing
- one of the five required state files is missing
- manifest task key or formal state root does not match the binding
- manifest mode or structural fields are invalid

Validation warns when a likely derived view, such as a handoff summary, appears
inside a formal state root.

## Handoff And Resume

`ach handoff <task-key>` derives a handoff from the formal state root.

`ach preflight <task-key>` checks whether the task is ready to resume.

The handoff is a derived view. It never replaces the formal state root.
