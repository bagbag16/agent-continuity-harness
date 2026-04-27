# Recovery With ACH

## Project Behavior

ACH stores recoverable state in a formal state root and derives handoff from
that state.

Try the fixture:

```bash
node bin/ach.js validate examples/fixtures/valid-basic
node bin/ach.js handoff demo-task --root examples/fixtures/valid-basic
node bin/ach.js preflight demo-task --root examples/fixtures/valid-basic
```

## What ACH Preserves

- current goal
- confirmed constraints
- pending items
- decisions
- manifest and binding consistency

## What Changes

The next chat does not have to trust a loose summary. It can recover from the
formal state root and treat handoff text as a derived view.

## Result

State inheritance becomes checkable:

- missing files fail validation
- manifest mismatches fail validation
- handoff is generated from state rather than memory
- pending items remain pending until confirmed
