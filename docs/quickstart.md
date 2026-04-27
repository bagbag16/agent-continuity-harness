# Quickstart

This quickstart is the smallest useful ACH trial path. ACH has two supported
surfaces:

- Codex skill: conversation continuity inside Codex.
- CLI: validateable recovery state in a workspace.

Use either one, or both. For exact install paths, see [install](install.md).

Use ACH when a task is likely to continue across multiple rounds, windows, or
handoffs. Do not use it for simple one-shot work.

## 1. Try The CLI

From the repository root:

```bash
npm test
npm run demo
node bin/ach.js validate examples/fixtures/valid-basic
node bin/ach.js handoff demo-task --root examples/fixtures/valid-basic
```

Expected behavior:

- tests pass
- the demo shows a rejected broken state and an accepted recovery state
- the valid fixture validates successfully
- handoff output says it is derived from the ACH formal state root

For command details, see [CLI](cli.md). For machine-readable failures, see
[error codes](error-codes.md).

## 2. Create State For A Task

In a workspace where you want durable recovery:

```bash
node path/to/agent-continuity-harness/bin/ach.js init my-long-task
node path/to/agent-continuity-harness/bin/ach.js validate --task my-long-task
node path/to/agent-continuity-harness/bin/ach.js preflight my-long-task
```

Expected behavior:

- `.cca-bindings.json` is created or updated
- `.cca-state/my-long-task/` contains the five required state files
- validation passes before handoff or resume

## 3. Install ACH As A Codex Skill

Install this repository as one Codex skill named `ach` when you want Codex to
use ACH during conversation.

Your Codex skills directory should contain:

```text
skills/
  ach/
    SKILL.md
    agents/
    assets/
    references/
    examples/
    docs/
    schemas/
    bin/
    scripts/
```

The repository root is the skill root. Do not install files inside
`references/` as separate skills; they are internal ACH rules. Keep the docs,
examples, schemas, and CLI with the skill so installed ACH matches the public
repository behavior.

Local sync helper:

```powershell
.\scripts\sync-installed-skill.ps1
```

Manual install:

1. Download or clone this repository.
2. Copy the repository folder into your Codex skills directory.
3. Rename the folder to `ach` if needed.
4. Start a new Codex session or reload available skills.
5. Ask Codex to use ACH for a long-running task.

ACH is installed correctly when Codex recognizes `$ach` or `ach` as the single
public entry.

This install is for Codex skill behavior. It is separate from the terminal
`ach` CLI command.

## 4. Start With ACH

```text
Use ACH for this task. I want the current goal, confirmed constraints,
pending items, and handoff state to remain stable across future rounds.

Task: <describe the long-running task here>
```

Expected behavior:

- ACH starts lightweight
- the agent does not create formal state immediately
- the agent separates confirmed facts from assumptions when needed

## 5. Stabilize Drift

Use this when the conversation is becoming broad or inconsistent:

```text
Use ACH. The discussion is starting to drift.
Recover the current goal, confirmed constraints, and pending questions before
continuing.
```

Expected behavior:

- compact readback of the active task boundary
- assumptions marked as assumptions
- next step limited to the stabilized goal
- obvious flawed paths or weak assumptions are called out before they become inherited state

## 6. Prepare A Handoff

Use this before switching chats or handing the task to another agent:

```text
Use ACH. I am going to continue this task in a new chat.
Prepare the minimum handoff state needed for recovery.
```

Expected behavior:

- ACH enters `continuity-mode` only if durable state is needed
- existing formal state is reused when valid
- new formal state is created only when no valid state exists

## 7. Resume Later

Start the next chat with:

```text
Use ACH to resume this task from the existing handoff state.
First recover the current goal, confirmed constraints, pending items, and
decisions, then continue with the next smallest useful step.
```

Expected behavior:

- the agent resumes from state rather than guessing from memory
- old decisions are not reopened without new evidence
- pending items remain pending

## Rule Of Thumb

Use normal conversation for short work. Use ACH when losing task continuity
would cost more than stabilizing it.
