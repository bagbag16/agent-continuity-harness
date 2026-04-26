---
name: ach
description: Formal public entry for Agent Continuity Harness. Use when Codex should keep long-running, drift-prone, cross-window, recovery-sensitive, or stateful collaboration coherent without asking the user to choose internal guard or continuity modes manually. Start in guard-mode by default; enter continuity-mode only when handoff, recovery, formal state, or cross-window continuation is needed.
---

# Agent Continuity Harness (ACH)

Agent Continuity Harness is the formal project name, with
`agent-continuity-harness` as the repository slug. Use `ach` as its short
invocation name.

ACH routes long-running AI collaboration through two internal modes:

- `guard-mode`: lightweight drift control, boundary stabilization, and minimal readback for normal multi-turn work.
- `continuity-mode`: formal state, handoff, recovery, and cross-window continuation when chat history is no longer enough.

Do not ask the user to choose between internal modules unless they explicitly ask about internals.

## Default Routing

1. Start in `guard-mode` when the task has no formal state root, recovery dependency, migration, binding, or window handoff requirement.
2. Use [references/adg/guard.md](./references/adg/guard.md) for guard-mode behavior.
3. Enter `continuity-mode` when the task depends on formal state, recovery, `.cca-bindings.json`, state migration, or a cross-window handoff.
4. Use [references/cca/entry.md](./references/cca/entry.md) for continuity-mode startup.
5. Return to `guard-mode` when formal continuity is no longer needed and the preserved state is sufficient for future recovery.

## Continuity Rules

When entering `continuity-mode`:

- Read the workspace `.cca-bindings.json` before assuming a state root.
- Reuse an existing valid formal state root when one exists.
- Create a new formal state root only when the task actually needs durable continuation and no valid root exists.
- Keep `current-goal`, `confirmed-constraints`, `pending-items`, and `decisions` distinct.
- Treat unresolved assumptions as assumptions, not confirmed facts.

Use [assets/state-templates/](./assets/state-templates/) only as templates for new formal state roots. The templates are not themselves live state.

Use [references/cca/outer.md](./references/cca/outer.md) for formal state write decisions, externalization gates, and state-effect rules.
Use [references/architecture-branch-map.md](./references/architecture-branch-map.md) and [references/design-constraints.md](./references/design-constraints.md) when changing ACH architecture branches, scoped design constraints, or public-project positioning.

## Public Boundary

- Present Agent Continuity Harness as the formal project identity and `ach` as
  the invocation shorthand.
- Treat `guard-mode` and `continuity-mode` as internal operating modes.
- Do not publish `adg` or `cca` as separate user choices in normal answers.
- Do not create a second state protocol outside `.cca-bindings.json` and the formal state root.
- Capability packs may extend ACH, but they must not rewrite routing or state-root rules.
