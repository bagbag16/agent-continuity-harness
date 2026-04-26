# State Templates

This directory contains templates for ACH `continuity-mode` state roots.

These files are not live task state. They are scaffolding used only when a task
actually needs durable recovery, handoff, or cross-window continuation.

## Minimum State Root

A formal state root should contain:

- `current-goal.md`
- `confirmed-constraints.md`
- `pending-items.md`
- `decisions.md`
- `state-manifest.json`

The workspace-level binding index remains `.cca-bindings.json`. The filename is
kept for compatibility with the internal continuity engine, but it should be
treated as ACH infrastructure rather than a separate public product surface.

## Creating State

Before creating a new state root:

1. Check whether the current task already has a valid formal state root.
2. Reuse that root when it is still valid.
3. Create a new root only when the task needs durable continuation and no valid
   root exists.
4. Copy or adapt the templates in this directory.
5. Record the `task_key -> formal_state_root` binding in the workspace
   `.cca-bindings.json`.
6. Fill `state-manifest.json` with the task key, state root path, active mode,
   and integrity status.

## Templates

- `current-goal.template.md`
- `confirmed-constraints.template.md`
- `pending-items.template.md`
- `decisions.template.md`
- `state-manifest.template.json`
- `cca-bindings.template.json`

If a template and a written instruction disagree, fix the mismatch rather than
letting runtime state grow a second format.
