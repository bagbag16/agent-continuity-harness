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

## Warnings

### `ACH_DERIVED_VIEW_IN_STATE_ROOT`

A likely derived view, such as a handoff summary, appears inside the formal
state root.

Fix: keep handoff output outside the formal state root unless it is explicitly
externalized into one of the core state files.
