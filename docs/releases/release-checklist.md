# Release Checklist

Use this checklist before tagging an ACH release.

## Required Checks

```bash
npm test
node bin/ach.js validate examples/fixtures/valid-basic
node bin/ach.js validate examples/fixtures/invalid-missing-file --json
node bin/ach.js validate examples/fixtures/invalid-manifest-mismatch --json
npm pack --dry-run
```

## Product Checks

- README states the continuity harness value before internal architecture.
- Quickstart shows a runnable CLI path.
- Handoff output is derived from formal state.
- The four-file state core remains unchanged.
- No new state protocol is introduced.
- `CHANGELOG.md` includes the release notes.

## Scope Checks

- No agent runtime.
- No general memory platform.
- No dashboard-first scope.
- No internal mode published as a separate product.
- CFR remains a design-time review gate, not runtime dependency.
