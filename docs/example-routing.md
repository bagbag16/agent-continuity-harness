# Example: A Real Task Through ACH (guard → continuity → handoff → resume)

This is one end-to-end walkthrough that shows how ACH actually feels when a
user works through a multi-turn, drift-prone task. It uses the ACH CLI for
mechanical steps and the Intent Workflow Presets to translate natural user
language into the right workflow.

Reading this once builds more intuition than reading the rules alone.

---

## Scenario

> User: "Help me rewrite the backend API rate limiter. The old one is messy.
> I want a token bucket."

## Turn 1 — Default `guard-mode` Entry

ACH starts in `guard-mode` because nothing yet depends on a formal state root,
recovery, binding, or cross-window handoff.

Agent (following adg `Default Form`) collapses the problem before doing work:

> **Current real problem**: Replace the old rate-limiting logic with a token
> bucket implementation.
>
> - `confirmed`: use token bucket; rewrite the module; backend-only scope
> - `tentative`: keep the existing public interface signature so callers don't
>   change
> - `pending`:
>   - per-user or per-IP limiting?
>   - do we keep the old logic for an A/B period?
>   - what are the default bucket capacity and refill rate?
> - `not this step`: monitoring, alerting, migration scripts

By adg §1 rule 3 ("undefined terms held pending"), `token bucket` is a known
term and does not need to be held. But "per-user vs per-IP" is a high-impact
pending item; by §1 rule 1 it must not be expanded into a default assumption.

### Counter-example (what not to do)

Replying directly with "I'll implement the per-user version" — this smuggles a
pending item into a confirmed premise and violates adg §1 rule 1.

---

## Turns 2–5 — Resolution and Progress

> User: "Per-user. Pick reasonable defaults, you can tune them. Keep the old
> interface."

State updates:

- "per-user" → `pending` to `confirmed`
- "default capacity/refill" → `pending` to `tentative` (user delegated)
- "old interface signature" → `tentative` to `confirmed`

Several turns of design and code iteration follow, still inside `guard-mode`.
No upgrade trigger fires because:

- no cross-window dependency
- no formal state root needed
- no mid-takeover
- state is not drifting (user is engaged every turn)

By `system/routing.md`, none of the upgrade triggers are met — stay in
`guard-mode`.

---

## Turn 6 — User Signals an Upgrade

> User: "Let's stop here for today. Tomorrow I'll continue in a new window.
> I'm signing off."

This is a clear `system/routing.md` upgrade trigger: "user plans to continue
in another window or a new conversation". By `Intent Workflow Presets` this
maps to the **pause / hand off / prepare for next window** preset.

### Counter-example (what not to do)

Replying with just "OK, see you tomorrow" — the next window's agent has no
formal state to recover from, and by SKILL.md `Continuity Rules` and
`docs/state-contract.md` this fails the cross-window continuation contract.

---

## Turn 6 — Continuity Setup with CLI

The agent uses ACH CLI commands for the mechanical work. CLI is a verifier
and recovery tool inside the workflow — not the user-facing surface. The user
should mostly see status output, not raw command transcripts.

### Bind a formal state root

```
ach init api-ratelimit-refactor --root .
```

This creates `.cca-state/api-ratelimit-refactor/` from the templates and writes
the binding into `.cca-bindings.json`. If a binding already exists, the CLI
reuses it (single-root rule).

### Populate the recovery core

The agent fills the four files based on the conversation so far. The minimum
payload to make the task recoverable:

**current-goal.md**
- axis: rewrite backend API rate limiter as token bucket
- phase: base implementation ~60%; Redis storage adapter and unit tests remain
- next: implement Redis storage adapter

**confirmed-constraints.md**
- per-user limiting
- keep existing interface signature
- default capacity 100, default refill 10/s (tentative, user-delegated)

**pending-items.md**
- keep old logic for A/B period? (does not block; new version can ship alone)
- monitoring hooks (out of scope this step)

**decisions.md**
- chose token bucket over leaky bucket (business needs burst tolerance)
- preserve interface signature (avoid caller changes)

### Verify the write-to-use loop closes

```
ach check-write api-ratelimit-refactor --json
```

This is the State-Effect Router closure check from SKILL.md: a write isn't
done just because content was added to a file; it's done when a future session
can recover the intended effect.

### Preflight before announcing handoff

```
ach preflight api-ratelimit-refactor --json
```

This runs the cross-window readiness check from `system/startup-and-recovery.md`
and matches the closure items in SKILL.md `State-Effect Router`:

- active layer determined
- current axis recoverable
- current phase recoverable
- active constraints written
- impactful unresolved items written
- minimum decision results recoverable
- new window can recover from the minimum startup pack alone

If anything fails, fix the state file first — do not produce a handoff summary
yet.

### Generate the handoff summary

```
ach handoff api-ratelimit-refactor --compact
```

The compact handoff is a derived view of the four files plus any active
`supplemental_documents`. Its content comes from formal state, not from chat
memory — this is the `outer.md` boundary on handoff summaries.

### Render the user-facing status view (not the raw handoff)

Per SKILL.md `User-Facing Status Rendering`, the user does not need the raw
manifest dump. The agent's actual reply to the user is the compact status
view:

> **Task**: API rate limiter rewrite (token bucket)
>
> **State root**: `.cca-state/api-ratelimit-refactor/` (bound)
>
> **Active constraints**: per-user / preserve interface signature / capacity
> 100, refill 10/s (tunable)
>
> **Current phase**: base implementation ~60%; Redis adapter + tests remain
>
> **Pending**: A/B window decision (non-blocking)
>
> **Next step**: implement Redis storage adapter
>
> Resume in the next window with: `ach resume api-ratelimit-refactor`

This is what the user sees and copies. Internal manifest fields, validator
entries, and supplemental document inventory are not shown unless the user
explicitly asks for audit detail.

---

## Turn N — New Window Picks Up

In the new conversation:

```
ach resume api-ratelimit-refactor --json
```

The CLI prints the minimum startup pack:

- state-manifest summary
- four-file recovery core
- active layer pointer
- any `default_read: true` supplemental documents

Per `system.md` minimum startup path, the agent reads `system.md` first, then
the recovery core, then `inner.md` (because the active layer is `inner`). It
does not read `outer.md` because no externalization decision is currently on
the table.

Recovery complete. The agent continues implementing the Redis storage
adapter.

---

## After Completion — Return to `guard-mode`

After Redis adapter is written, tests pass, and pending items either resolve
or stay non-blocking, the agent considers `system/routing.md` return
conditions:

- formal state root still bound and singular
- high-impact state already in formal files
- this turn no longer depends on recovery / binding / migration / handoff /
  state governance
- the problem is back to ordinary execution

All four hold. The agent can return to `guard-mode`. Formal state root is
**not deleted**; the binding is **not removed**. Only the working mode for
this turn returns to lightweight.

Optionally announce:

```
ach status api-ratelimit-refactor --brief
```

shows `route` is now back to a maintenance posture, and the user can stop
thinking about continuity until the next durable interruption.

---

## What This Example Demonstrates

- **CLI is the mechanical surface, not the user-facing surface**. The agent
  runs `ach preflight / handoff / status / resume` internally; the user sees
  prose status, not transcripts.
- **The four files are the recovery contract**. Everything else (manifest
  metadata, supplemental documents, handoff summary, user-facing status) is a
  derivation or projection of them.
- **Returning to `guard-mode` is not state cleanup**. Mode change does not
  unbind or delete a formal state root.
- **Intent Workflow Presets cover the common path**. The user says "let's
  stop here" — the agent does not ask the user to pick between commands; it
  runs the pause / handoff preset and reports the user-facing result.

## What This Example Does Not Cover

- mid-takeover (user picks up a thread left by someone else)
- drift-triggered upgrade where no explicit user signal is given
- capability pack activation
- `supplemental_documents` for branch-heavy tasks (see
  `monster-balance-phase-2` style usage with `active-context` /
  `branch-attempt-ledger` / `artifact-provenance-index` /
  `state-relation-index`)
- validators (see `docs/state-contract.md` Optional Validators)

For these, see `references/cca/system/` topical files or the corresponding
templates under `assets/state-templates/`.
