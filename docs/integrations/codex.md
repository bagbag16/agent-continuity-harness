# Codex

Codex is the primary ACH skill target.

## Install Shape

Install the repository as one skill named `ach`. Keep `SKILL.md`, `references/`,
`assets/`, `examples/`, `docs/`, `schemas/`, and `bin/` together so the skill,
examples, schemas, and CLI describe the same product.

Do not install `references/adg` or `references/cca` as separate skills.

## Invocation

```text
Use ACH for this task. Keep the current goal, confirmed constraints, pending
items, and decisions stable across future rounds.
```

Expected behavior:

- ACH starts lightweight.
- Formal state is created only when recovery or handoff needs it.
- Existing `.cca-bindings.json` state is reused when valid.
- The agent challenges weak assumptions or flawed paths before preserving them
  as inherited state.

## CLI Use

Use the CLI when the task needs durable recovery:

```bash
ach validate --task <task-key>
ach preflight <task-key>
ach handoff <task-key>
```

