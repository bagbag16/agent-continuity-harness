# Agent Continuity Harness (ACH)

**Continuity for AI agent work that outgrows one chat.**

Long-running agent work usually fails at the handoff point: goals drift,
assumptions harden into facts, and the next chat cannot recover the real task
state.

ACH gives Codex one public skill entry, `ach`, that starts lightweight and
escalates only when the task needs formal continuity state.

```text
Use ACH for this task. Keep the current goal, confirmed constraints,
pending items, and handoff state stable across future rounds.
```

ACH also protects state quality: it separates user goals from proposed paths,
flags weak assumptions before they become inherited facts, and points out
low-cost better routes when the current path has clear flaws.

The formal project name is Agent Continuity Harness, with
`agent-continuity-harness` as the repository slug. `ach` is the short skill name
used to invoke it.

It is not another prompt template, agent framework, or memory database. ACH is
the layer that decides when a normal conversation needs a lightweight guard, and
when it needs formal continuity state.

## The Problem

Long-running AI work often fails quietly:

- the goal drifts after several rounds
- assumptions become treated as confirmed facts
- old constraints get forgotten after new information appears
- a new chat cannot recover the real task state
- handoffs depend on whatever happened to remain in chat history

ACH exists for this narrow failure mode: the model can still do the next step,
but the task line is starting to lose continuity.

## When To Use ACH

Use ACH when you are thinking:

- "This task will continue later, and I do not want to re-explain it."
- "The conversation is starting to drift; first stabilize the boundary."
- "I need to move this work into a new chat without losing state."
- "The current goal, constraints, and open questions must not stay only in chat."
- "Someone else may need to take over this task from the current point."

Do not use ACH for one-shot questions, simple edits, short lookups, or tasks
where the next step is already obvious and low-risk.

## How To Use It

ACH is not CLI-only. It has two supported surfaces:

| Surface | Use it when | What you install |
| --- | --- | --- |
| Codex skill | You want Codex to keep a long-running conversation stable | The repository folder as one skill named `ach` |
| CLI | You want a workspace to have validateable recovery state | The Node CLI command `ach` |

Other agent clients can still use ACH through the CLI and state contract, but
they do not automatically get Codex skill behavior unless they support Codex
skills.

One-line installs are listed in [install](docs/install.md).

## Quick Start

Try the formal state contract from the repository root:

```bash
npm test
npm run demo
node bin/ach.js validate examples/fixtures/valid-basic
node bin/ach.js handoff demo-task --root examples/fixtures/valid-basic
```

Create a new state root in your own workspace:

```bash
node bin/ach.js init my-long-task
node bin/ach.js validate --task my-long-task
node bin/ach.js preflight my-long-task
```

Install the repository as one Codex skill named `ach` when you want Codex
client conversations to use the same continuity rules:

```text
Use ACH for this task.
```

ACH starts in `guard-mode` by default. It enters `continuity-mode` only when the
task needs recovery, handoff, a formal state root, or cross-window continuation.

For exact install paths, see [install](docs/install.md).
For a fuller setup path, see [quickstart](docs/quickstart.md).
For the before/after recovery proof, see [demo](docs/demo.md).
For command details, see [CLI docs](docs/cli.md) and
[error codes](docs/error-codes.md).
For host-tool notes, see [integrations](docs/integrations/README.md).

## What You Get

ACH has one public entry:

- `ach`: the user-facing Agent Continuity Harness

ACH now also includes a small CLI:

- `ach init`: create the minimum formal state root
- `ach bind`: bind a task key to an existing state root
- `ach validate`: check binding and state-root integrity
- `ach checkpoint`: append controlled updates to a state file
- `ach handoff`: derive handoff text from formal state
- `ach preflight` / `ach resume`: check recovery readiness

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
- [Recovery failure without ACH](examples/07-recovery-failure.md)
- [Recovery with ACH](examples/08-recovery-with-ach.md)

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
[changelog](CHANGELOG.md), [versioning](docs/releases/versioning.md), and
[contributing](CONTRIBUTING.md).

## Repository Layout

- `SKILL.md`: the public ACH entry.
- `docs/`: quickstart, FAQ, distribution notes, and reusable project template.
- `scripts/`: demo and local Codex skill sync helpers.
- `examples/`: before/after examples and a transcript-style demo.
- `schemas/`: public JSON schemas for the state manifest and binding index.
- `bin/ach.js`: the portable CLI for validation, handoff, and recovery checks.
- `test/`: CLI tests and fixture checks.
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
