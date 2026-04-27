# Versioning

ACH uses SemVer, with a stricter compatibility note while the project is still
below `1.0.0`.

## Public Contract

The public contract includes:

- the package name: `agent-continuity-harness`
- the CLI command name: `ach`
- the five required state files
- `.cca-bindings.json`
- `state-manifest.json`
- stable `ACH_*` error codes
- the single public Codex skill entry: `ach`

Internal references under `references/` may change when they preserve the
public contract and improve execution.

## Pre-1.0 Rules

- Patch releases fix docs, examples, tests, or compatible CLI behavior.
- Minor releases may refine schemas, error codes, or state-root rules.
- Any release that changes required state files, binding shape, or CLI command
  names must call that out in `CHANGELOG.md`.

## Release Steps

1. Update `CHANGELOG.md`.
2. Run the release checklist.
3. Create a tag using `v<version>`.
4. Let the release check workflow build and upload the package artifact.
5. Publish manually only after the artifact has been inspected.

