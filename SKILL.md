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

## User-Facing Status Rendering

When the user asks for current status, progress, what to do next, or to
continue a bound task, recover from ACH state internally but answer in a
user-facing status view by default.

When a formal state root is bound and the CLI is available, prefer
`ach status <task-key> --json` as the mechanical source for this view instead
of manually reconstructing current route, blockers, artifacts, and read order
from state files.

Default status answers should show only:

- current route or active mouth
- current usable state
- active rules or constraints that affect the next step
- current blockers or open decisions
- the next suggested action

Do not show formal state root mechanics, manifest details, supplemental document
inventory, validator internals, or a full recovery-core dump unless the user
explicitly asks for audit detail, handoff detail, internals, or the raw state
view.

In Codex usage, the chat viewport is the user-facing status surface. CLI status
output is a backend extraction payload for the skill, not the raw user-facing
view.

## State-Effect Router

When the user asks to record, externalize, checkpoint, continue from, pause, or
correct durable task state, route the state effect to the smallest appropriate
ACH state target. Do not ask the user to choose a file unless the state effect
is ambiguous and cannot be inferred from the current state root.

Use this routing before editing state:

- route, mouth, current entry, or current valid artifacts changed: update
  `active-context` when present; update `current-goal` if the recovery core
  would otherwise become stale
- confirmed active rule or constraint changed: update
  `confirmed-constraints`; also update `active-context` when it affects
  immediate recovery
- branch tried, rejected, downgraded, or preserved as diagnostic: update
  `branch-attempt-ledger` when present, or reference the branch outcome from
  `decisions` when no supplemental layer is active
- reusable chart, config, workbook output, script, generated table, or summary
  created: update `artifact-provenance-index` when present
- dependency, conflict, supersession, invalidation, inverted constraint, or
  impact relation matters for future reasoning: update `state-relation-index`
  when present
- ordinary unresolved next step or non-blocking follow-up: update
  `pending-items`

After choosing the write target, close the write-to-use loop. A state write is
not complete merely because content was added to a file; it is complete only
when a future session can recover and use the intended effect from state.

For every durable state edit, check:

- current recovery: if the edit changes what should be treated as current,
  update `active-context` or the four-file recovery core so compact recovery
  and user-facing status can see it
- read path: if the edit changes what should be read next, update read order,
  current artifacts, current blockers, or the relevant `read_when` surface
- validity relations: if the edit changes old state validity, mark the old
  item as `superseded`, `diagnostic`, `rejected`, or with a
  `replacement`/relation instead of leaving competing states active
- artifact linkage: if the edit creates or updates reusable artifacts, connect
  `depends_on` and `source_paths` when available and distinguish active
  evidence from diagnostic evidence
- user-facing effect: if the user would expect this edit to affect "what is
  current", make sure the user-facing status answer would include the effect
  without relying on chat memory
- validation: run the affected task's ACH validation when practical; if
  validation cannot run, say so explicitly

When a formal state root is bound and the CLI is available, use
`ach check-write <task-key> --json` after durable state edits to mechanize this
closure check. Use `ach add-supplemental` and `ach artifact add/check` for
standard supplemental document and artifact-index maintenance instead of
manually editing manifest entries when those commands cover the needed change.

If an edit is useful only as cold evidence and should not affect current
recovery or user-facing status, keep it out of the default read path and mark
the condition under which it should be read.

Only create or expand supplemental layers when the corresponding complexity
risk exists, such as branch conflict, current-route ambiguity, reusable
artifacts, correction impact, inverted constraints, or cross-window recovery.
For ordinary tasks, keep the four-file recovery core sufficient.

## Intent Workflow Presets

ACH should feel like a default workflow, not a set of commands the user must
assemble. When the user uses natural task-control language, translate the
intent into the corresponding ACH workflow without asking them to name ACH
internals or choose files.

Use these presets by default:

- continue, resume, next, or keep going on a bound task: resolve the binding,
  run `ach preflight <task-key> --json` or `ach resume <task-key> --json` when
  practical, use `ach status <task-key> --json` for the current user-facing
  state view, read only the additionally required state files, then continue
  the work
- record, externalize, checkpoint, remember, or lock this in: route the state
  effect through `State-Effect Router`, use `ach record <task-key>` when the
  effect is a supported structured append, close the write-to-use loop,
  validate the affected task root when practical, then report only the
  user-visible effect
- correct, revise, rollback an assumption, or self-check for drift: identify
  the changed assumption, scan affected constraints, routes, artifacts, and
  pending items, downgrade or supersede stale state, update the current
  recovery path, validate when practical, then continue from the corrected
  state
- pause, stop here, hand off, or prepare for next window: update current goal,
  pending items, and `active-context` when present, ensure current artifacts
  and blockers are named, prefer `ach pause <task-key>` when practical, then
  provide a compact resume summary rather than a raw state dump
- status, progress, what next, or where are we: recover from ACH state
  internally, prefer `ach status <task-key> --json` when available, and render
  the user-facing status view; do not expose manifest, validator, or
  supplemental-document mechanics by default

If no bound formal state root exists, remain in `guard-mode` unless durable
continuation, recovery, or cross-window handoff is actually needed. Create or
bind a formal state root only when the workflow would otherwise depend on chat
memory.

CLI commands are verifier and recovery tools inside these workflows, not the
user-facing workflow itself. Prefer executing the needed ACH commands directly
over instructing the user to run them. If a CLI command fails or is unavailable,
fall back to reading and editing the formal state root directly, and say which
mechanical check could not be automated.

Use `ach list` for routine task discovery because it stays usable when old
bindings are invalid. Use `ach health` when the goal is strict workspace
health. Use `ach repair <task-key> --safe` only for mechanical state-root
repairs; never use it to rewrite user intent, design conclusions, or
project-domain content.

## Public Boundary

- Present Agent Continuity Harness as the formal project identity and `ach` as
  the invocation shorthand.
- Treat `guard-mode` and `continuity-mode` as internal operating modes.
- Do not publish `adg` or `cca` as separate user choices in normal answers.
- Do not create a second state protocol outside `.cca-bindings.json` and the formal state root.
- Capability packs may extend ACH, but they must not rewrite routing or state-root rules.
