# ACH Error Codes

`ach validate --json` returns stable error codes for CI and tooling.

## Errors

### `ACH_BINDINGS_MISSING`

`.cca-bindings.json` is missing or cannot be read.

Fix: run `ach init <task-key>` or create a valid binding index.

### `ACH_BINDINGS_INVALID`

`.cca-bindings.json` is not valid JSON.

Fix: repair the JSON file.

### `ACH_BINDINGS_VERSION`

The binding index version is not `1`.

Fix: update the binding index to the supported schema.

### `ACH_BINDINGS_SHAPE`

The binding index does not contain a `bindings` object.

Fix: use the structure documented in `docs/state-contract.md`.

### `ACH_BINDINGS_SCHEMA`

`.cca-bindings.json` does not match the public bindings schema.

Fix: compare the file with `schemas/bindings.schema.json`.

### `ACH_TASK_NOT_BOUND`

The requested task key does not exist in `.cca-bindings.json`.

Fix: run `ach bind <task-key> <state-root>`.

### `ACH_BINDING_SHAPE`

A binding does not contain `formal_state_root`.

Fix: add the missing field.

### `ACH_STATE_ROOT_OUTSIDE_WORKSPACE`

The formal state root points outside the workspace.

Fix: bind to a workspace-local path.

### `ACH_STATE_ROOT_MISSING`

The bound state root directory does not exist.

Fix: create the state root or update the binding.

### `ACH_REQUIRED_FILE_MISSING`

One of the five required formal state files is missing.

Fix: restore `current-goal.md`, `confirmed-constraints.md`,
`pending-items.md`, `decisions.md`, or `state-manifest.json`.

### `ACH_STATE_FILE_EMPTY`

A required markdown state file is empty.

Fix: fill the minimum recovery content.

### `ACH_MANIFEST_INVALID`

`state-manifest.json` is not valid JSON.

Fix: repair the manifest.

### `ACH_MANIFEST_SCHEMA`

`state-manifest.json` does not match the public state manifest schema.

Fix: compare the file with `schemas/state-manifest.schema.json`.

### `ACH_MANIFEST_VERSION`

The manifest version is not `1`.

Fix: update the manifest to the supported schema.

### `ACH_MANIFEST_TASK_MISMATCH`

The manifest task key does not match the binding key.

Fix: correct either the manifest or the binding.

### `ACH_MANIFEST_ROOT_MISMATCH`

The manifest formal state root does not match the binding.

Fix: correct either the manifest or the binding.

### `ACH_MANIFEST_MODE`

`active_mode` is not `guard-mode` or `continuity-mode`.

Fix: use a supported mode.

### `ACH_MANIFEST_PACKS`

`active_packs` is not an array.

Fix: use an array, even when empty.

### `ACH_MANIFEST_SUPERSEDED_ROOTS`

`superseded_roots` is not an array.

Fix: use an array, even when empty.

### `ACH_SCHEMA_UNAVAILABLE`

The CLI could not load the public schema files shipped with ACH.

Fix: reinstall ACH or run validation from a complete checkout/package.

### `ACH_SUPPLEMENTAL_DOCUMENT_MISSING`

A manifest-listed supplemental document is missing.

Fix: restore the document, remove the manifest entry, or set
`blocks_recovery_if_missing` to `false` when the document is useful but not
required for recovery. Missing documents fail validation only when they block
recovery; otherwise they warn.

### `ACH_SUPPLEMENTAL_DOCUMENT_OUTSIDE_STATE_ROOT`

A manifest-listed supplemental document points outside the formal state root.

Fix: move the document into the formal state root or correct the manifest path.

### `ACH_ACTIVE_CONTEXT_MISSING_SECTION`

A manifest-listed `active-context` document is missing a required recovery
section such as current route, active rules, active artifacts, current blockers,
or read order.

Fix: restore the missing section or mark the supplemental document as
non-blocking if it is not required for recovery. Missing sections fail
validation when the active-context entry blocks recovery; otherwise they warn.

### `ACH_VALIDATOR_TARGET_OUTSIDE_STATE_ROOT`

A manifest-listed validator target points outside the formal state root.

Fix: move the validator target into the state root or correct the manifest
entry.

### `ACH_VALIDATOR_TARGET_MISSING`

A manifest-listed validator target is missing.

Fix: restore the target document or disable/remove the validator entry.

### `ACH_ARTIFACT_INDEX_INVALID`

An `artifact-index` validator found an invalid artifact index. Common causes
include duplicate artifact ids, missing artifact files, active-context artifacts
that are not indexed, unresolved same-index `depends_on` artifact ids,
non-active artifacts referenced by active-context, route or mouth mismatches, or
stale `source_paths`.

Fix: update `artifact-provenance-index.md`, `active-context.md`, or the
generated artifact so the active route and artifact evidence agree.

### `ACH_WRITE_CLOSURE`

`ach check-write` found a write-to-use closure issue. Common causes include an
active `active-context` that is not in the default read path, active artifacts
that are not indexed, artifact entries that are not active, or route/mouth
mismatches between the current route and active artifacts.

Fix: update `active-context.md`, `state-manifest.json`, or
`artifact-provenance-index.md` so future recovery can read and use the intended
state effect.

## Warnings

### `ACH_DERIVED_VIEW_IN_STATE_ROOT`

A likely derived view, such as a handoff summary, appears inside the formal
state root.

Fix: keep handoff output outside the formal state root unless it is explicitly
externalized into one of the core state files.

### `ACH_SUPPLEMENTAL_ROLE_UNKNOWN`

A supplemental document role is not one of ACH's known roles and the entry is
not marked with `status: "custom"`.

Fix: use a standard role, or mark the entry as custom when it is intentionally
outside ACH's known supplemental layer set.

### `ACH_SUPPLEMENTAL_DOCUMENT_NOT_FILE`

A manifest-listed supplemental document exists but is not a regular file.

Fix: point the manifest entry to a markdown file inside the formal state root.

### `ACH_SUPPLEMENTAL_DOCUMENT_EMPTY`

A manifest-listed supplemental document exists but has no content.

Fix: add enough content for recovery, or remove the manifest entry until the
document is useful.
