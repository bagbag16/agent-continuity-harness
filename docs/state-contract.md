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
- optional `validators`
- `last_handoff`
- `superseded_roots`
- `integrity_status`

Supplemental documents are not core state files. They are indexed references
that should be read only when their `read_when` condition applies.

ACH state has layered recovery semantics:

- The required files and manifest are the recovery core.
- Supplemental documents are optional expansions for complex tasks.
- Validators check recovery integrity only.
- Project-specific correctness, such as numeric balance, simulation validity,
  domain scoring, or regeneration logic, belongs in project-local tools and
  documents rather than the ACH public contract.

### Optional Supplemental Documents

The four markdown files remain the recovery source of truth. Supplemental
documents may explain, index, or connect complex state, but they must not
override the core files.

Declare supplemental documents under `supplemental_documents`:

```json
{
  "id": "S1",
  "path": "active-context.md",
  "role": "active-context",
  "status": "active",
  "default_read": true,
  "read_when": "Read before resuming a complex multi-branch task.",
  "blocks_recovery_if_missing": false
}
```

Standard roles:

- `active-context`: current effective route, mouth, constraints, and artifact switchboard.
- `branch-attempt-ledger`: tried routes, preconditions, assumption deltas, result meaning, downgrade or discard reasons, and portability.
- `artifact-provenance-index`: generated outputs and the route or mouth that produced them.
- `state-relation-index`: typed dependencies, supersessions, conflicts, invalidations, and inverted constraints.
- `compiled-lineage`: durable route reasoning or decision lineage compiled from prior work.

Rules:

- supplemental paths must stay inside the formal state root
- unknown roles should use `status: "custom"` or they will warn during validation
- missing supplemental documents warn by default
- missing supplemental documents fail validation only when `blocks_recovery_if_missing` is `true`
- `default_read: true` means handoff includes the document content
- `default_read: false` means handoff lists the document and its `read_when` condition without dumping content

### Optional Validators

Validators are manifest-declared built-in checks. They do not execute arbitrary
state-root scripts.

Declare validators under `validators`:

```json
{
  "id": "V1",
  "type": "artifact-index",
  "target": "artifact-provenance-index.md",
  "active_context": "active-context.md",
  "status": "active",
  "blocks_recovery_if_failed": true
}
```

Supported validator types:

- `artifact-index`: validates artifact index structure, path existence,
  artifact-id dependencies, optional `source_paths`, and alignment between
  active-context current artifacts and the current route.

Validator boundary:

- validators do not execute arbitrary state-root scripts
- validators do not judge domain correctness
- validators do not regenerate artifacts
- validators do not infer semantic dependency graphs beyond declared fields
- `depends_on` entries may include artifact ids, file paths, or external labels;
  the built-in validator only resolves entries that look like artifact ids in
  the same artifact-index id namespace

Rules:

- validator targets must stay inside the formal state root
- `status: "disabled"` skips the validator
- failed validators warn by default
- failed validators fail validation when `blocks_recovery_if_failed` is `true`

## Validation

Run:

```bash
ach validate
```

or machine-readable:

```bash
ach validate --json
```

Task-scoped validation is available:

```bash
ach validate --task demo-task
```

With `--task`, validation checks only the selected binding and its formal state
root. This keeps one recoverable task from being blocked by unrelated legacy or
experimental bindings in the same workspace. Full `ach validate` still checks
the complete binding index.

The CLI loads the public schemas in `schemas/` and then applies semantic checks
for binding consistency, required files, supplemental documents, optional
validators, and derived views inside state roots.

Validation fails when:

- `.cca-bindings.json` is missing or invalid
- a bound state root is missing
- one of the five required state files is missing
- manifest task key or formal state root does not match the binding
- manifest mode or structural fields are invalid
- a manifest-listed supplemental document escapes the formal state root
- a manifest-listed supplemental document is missing and marked as blocking recovery
- a blocking `active-context` document is missing required recovery sections
- a blocking validator target is missing or outside the state root
- a blocking `artifact-index` validator fails

Validation warns when:

- a likely derived view, such as a handoff summary, appears inside a formal state root
- a non-blocking supplemental document is missing
- a supplemental role is unknown and not marked custom
- a supplemental document is empty or is not a regular file
- a non-blocking `active-context` document is missing required recovery sections
- a non-blocking validator target is missing, outside the state root, or fails

## Handoff And Resume

`ach handoff <task-key>` derives a handoff from the formal state root.

`ach preflight <task-key>` checks whether the task is ready to resume.

The default handoff is compact. When a default-read `active-context` document
exists, compact handoff prioritizes selected semantic sections from that
document. Without active context, it falls back to bounded excerpts from the
four-file recovery core. It always lists declared supplemental documents and
never replaces the formal state root.

Use `ach handoff <task-key> --full` when complete derived content is needed.
