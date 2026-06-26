<!-- Language switch -->
**English** | [中文](./README.zh.md)

# Agent Continuity Harness (ACH)

**ACH keeps long-running AI work recoverable when one chat is no longer enough.**

Use ACH when an agent task may drift, pause, move across windows, or need another agent to resume it without guessing from chat history. ACH starts light, then creates formal state only when continuity is actually at risk.

ACH is not a project manager and not a memory dump. It is a continuity harness: it anchors the goal, records constraints, externalizes recoverable state, and makes handoff possible.

```mermaid
flowchart TD
  T["Incoming task"] --> G["Guard mode"]
  G -->|"anchor goal, constraints, weak assumptions"| W["Continue normally"]
  W -->|"handoff / recovery / cross-window risk"| C["Continuity mode"]
  C --> S["Formal state root"]
  S --> A["active-context: current route"]
  S --> B["branch-attempt-ledger: tried paths"]
  S --> P["artifact-provenance-index: outputs"]
  S --> R["state-relation-index: dependencies"]
  R --> H["Resume from state, not chat memory"]
```

## Use It When

- A task will take many turns, windows, branches, or recovery attempts.
- The goal, constraints, evidence, or decisions must survive a restart.
- Another agent must resume the work without replaying the whole conversation.
- Drift is likely and the cost of losing context is higher than the cost of keeping state.

Do not use ACH for short questions, simple edits, or tasks where the current chat is enough.

## What It Does

1. Starts in `guard-mode`: keep the goal and constraints visible without creating heavy state.
2. Watches for continuity risk: handoff, recovery, branching, repeated failure, or cross-window work.
3. Enters `continuity-mode` only when needed.
4. Creates a state root that records the current route, decisions, attempts, evidence, and unresolved risks.
5. Lets a future agent resume from state instead of guessing from chat fragments.

## Core Files

| File | Purpose |
| --- | --- |
| [active-context](./assets/state-templates/active-context.template.md) | Current goal, route, read order, and next action |
| [branch-attempt-ledger](./assets/state-templates/branch-attempt-ledger.template.md) | Tried routes, forks, failures, and why they mattered |
| [artifact-provenance-index](./assets/state-templates/artifact-provenance-index.template.md) | Outputs, source evidence, validity, and expiry |
| [state-relation-index](./assets/state-templates/state-relation-index.template.md) | Dependencies, conflicts, supersessions, and recovery links |

## Quick Start

Ask for ACH when continuity matters:

```text
Use ACH for this task. Start light, but create formal state if the work needs handoff, recovery, or cross-window continuation.
```

Expected behavior:

- The agent keeps ordinary work lightweight.
- The agent escalates only when the task earns formal state.
- The state root becomes the source of recovery, not the raw conversation.

## Boundary

ACH manages continuity. It does not decide product strategy, replace task-specific validation, or make every task bureaucratic. If the work can finish cleanly in the current context, ACH should stay in guard mode.

## License

MIT.
