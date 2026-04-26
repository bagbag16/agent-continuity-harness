# Quickstart

This quickstart is the smallest useful ACH trial path: install once, start
lightweight, and enter continuity only when handoff or recovery needs it.

Use ACH when a task is likely to continue across multiple rounds, windows, or
handoffs. Do not use it for simple one-shot work.

## 1. Install ACH

Install this repository as one Codex skill named `ach`.

Your Codex skills directory should contain:

```text
skills/
  ach/
    SKILL.md
    agents/
    references/
    assets/
```

The repository root is the skill root. Do not install files inside
`references/` as separate skills; they are internal ACH rules.

Manual install:

1. Download or clone this repository.
2. Copy the repository folder into your Codex skills directory.
3. Rename the folder to `ach` if needed.
4. Start a new Codex session or reload available skills.
5. Ask Codex to use ACH for a long-running task.

ACH is installed correctly when Codex recognizes `$ach` or `ach` as the single
public entry.

## 2. Start With ACH

```text
Use ACH for this task. I want the current goal, confirmed constraints,
pending items, and handoff state to remain stable across future rounds.

Task: <describe the long-running task here>
```

Expected behavior:

- ACH starts lightweight
- the agent does not create formal state immediately
- the agent separates confirmed facts from assumptions when needed

## 3. Stabilize Drift

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

## 4. Prepare A Handoff

Use this before switching chats or handing the task to another agent:

```text
Use ACH. I am going to continue this task in a new chat.
Prepare the minimum handoff state needed for recovery.
```

Expected behavior:

- ACH enters `continuity-mode` only if durable state is needed
- existing formal state is reused when valid
- new formal state is created only when no valid state exists

## 5. Resume Later

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
