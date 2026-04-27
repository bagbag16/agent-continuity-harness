# Cursor

Use ACH in Cursor when a coding task spans sessions or when a human/agent
handoff needs more than chat history.

## Pattern

1. Keep ACH state in the workspace.
2. Ask the assistant to read the bound state root before resuming.
3. Run `ach validate` before trusting a handoff.

Example prompt:

```text
Use ACH to resume this task. First inspect .cca-bindings.json, recover the
bound current-goal, confirmed-constraints, pending-items, and decisions, then
continue with the next smallest useful step.
```

Cursor rules or project instructions can point to ACH, but they should not copy
the whole state into a permanent rule. The state root is the source of truth.

