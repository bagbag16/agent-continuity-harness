# Drift Recovery

## Failure Pattern

A task starts with a clear goal, but after several rounds the agent begins
optimizing a different problem. The user has to restate earlier constraints,
and the conversation spends more time correcting direction than making progress.

## Without ACH

The agent may continue from the newest message only:

- earlier constraints become background noise
- tentative ideas become treated as accepted decisions
- the next answer optimizes for fluency instead of the confirmed goal
- the user has to manually pull the conversation back on track

## With ACH

ACH starts in `guard-mode` and stabilizes the active boundary before continuing.

Expected behavior:

- restate the current goal only when drift risk is real
- separate confirmed constraints from assumptions
- identify which new information changes prior decisions
- continue with the smallest useful next step

## Example Prompt

```text
Use ACH for this task. The discussion is starting to drift.
First recover the current goal, confirmed constraints, and pending questions,
then continue only from that stabilized state.
```

## Good Result

The agent does not restart the whole project. It produces a compact readback,
flags any assumptions, and resumes from the corrected task boundary.
