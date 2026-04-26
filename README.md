# Agent Continuity Harness (ACH)

**Keep long-running AI agent work coherent when a task outgrows one chat.**

ACH is a continuity harness for long-running AI agent work. It helps an agent keep goals,
constraints, handoffs, and recovery stable across long conversations, window
switches, pauses, and mid-task takeovers.

The formal project name is Agent Continuity Harness, with
`agent-continuity-harness` as the repository slug. `ach` is the short skill name
used to invoke it.

It is not another prompt template, agent framework, or memory database. ACH is
the layer that decides when a normal conversation needs a lightweight guard, and
when it needs formal continuity state.

## The Problem

Long-running AI work usually fails quietly:

- the goal drifts after several rounds
- assumptions become treated as confirmed facts
- old constraints get forgotten after new information appears
- a new chat cannot recover the real task state
- handoffs depend on whatever happened to remain in chat history

ACH exists for this narrow failure mode: the model can still do the work, but
the task line is starting to lose continuity.

## When To Use ACH

Use ACH when you are thinking:

- "This task will continue later, and I do not want to re-explain it."
- "The conversation is starting to drift; first stabilize the boundary."
- "I need to move this work into a new chat without losing state."
- "The current goal, constraints, and open questions must not stay only in chat."
- "Someone else may need to take over this task from the current point."

Do not use ACH for one-shot questions, simple edits, short lookups, or tasks
where the next step is already obvious and low-risk.

## Quick Start

Install the repository as one Codex skill named `ach`.

```text
skills/
  ach/
    SKILL.md
    agents/
    references/
    assets/
```

Then ask Codex to use it:

```text
Use ACH for this task. Keep the current goal, confirmed constraints,
pending items, and handoff state stable across future rounds.
```

ACH starts in `guard-mode` by default. It enters `continuity-mode` only when the
task needs recovery, handoff, a formal state root, or cross-window continuation.

For a fuller setup path, see [quickstart](docs/quickstart.md).

## What You Get

ACH has one public entry:

- `ach`: the user-facing Agent Continuity Harness

Internally, ACH has two modes:

- `guard-mode`: lightweight drift control for normal multi-turn work
- `continuity-mode`: formal state, handoff, recovery, and cross-window continuation

You do not need to choose between internal modules. Ask for ACH, and let the
harness decide whether the current task should stay lightweight or move into
formal continuity.

## Examples

- [Drift recovery](examples/01-drift-recovery.md)
- [Window handoff](examples/02-window-handoff.md)
- [Long-task checkpoint](examples/03-long-task-checkpoint.md)
- [When not to use ACH](examples/04-when-not-to-use.md)
- [Transcript-style demo](examples/06-transcript-style-demo.md)

Each example shows the failure pattern first, then the ACH behavior that keeps
the task coherent.

## How ACH Differs

ACH is designed to complement existing AI coding tools and agent workflows.

| Tool or pattern | What it is good at | What ACH adds |
| --- | --- | --- |
| `AGENTS.md` | Project-level instructions for coding agents | Runtime continuity rules for long tasks |
| Prompt templates | Reusable wording | Drift, handoff, and recovery decisions |
| Agent frameworks | Building and running agents | Collaboration continuity inside agent work |
| Memory systems | Storing facts or context | Deciding what state must be formalized and when |

See [FAQ](docs/faq.md) for common comparison questions.

## Project

This repository is preparing its first public ACH release. See
[changelog](CHANGELOG.md) and [contributing](CONTRIBUTING.md).

## Repository Layout

- `SKILL.md`: the public ACH entry.
- `docs/`: quickstart, FAQ, distribution notes, and reusable project template.
- `examples/`: before/after examples and a transcript-style demo.
- `assets/state-templates/`: templates for formal continuity state.
- `references/`: internal guard and continuity rules used by ACH.

## Design Principles

- One formal project identity: Agent Continuity Harness.
- One invocation shorthand: `ach`.
- Lightweight by default.
- Escalate only when continuity is actually needed.
- Keep confirmed facts, assumptions, pending items, and decisions distinct.
- Do not make users choose internal guard or continuity modules manually.
- Do not create formal state unless the task needs recovery or handoff.

## License

MIT.
