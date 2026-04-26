# Window Handoff

## Failure Pattern

A task has to continue in a new chat or a new working window. The next agent
receives a partial summary, misses hidden constraints, and repeats decisions
that were already settled.

## Without ACH

The handoff depends on fragile chat memory:

- the previous goal may be summarized too broadly
- important constraints may be omitted
- pending questions may be confused with accepted scope
- the next agent may create a second competing state

## With ACH

ACH enters `continuity-mode` only when the task needs durable continuation.

Expected behavior:

- read or create the formal state root through `.cca-bindings.json`
- preserve the current goal, confirmed constraints, pending items, and decisions
- produce a handoff that the next chat can resume from
- avoid creating duplicate state roots

## Example Prompt

```text
Use ACH. I am going to continue this task in a new chat.
Prepare the minimum handoff state so the next agent can resume without
reconstructing the task from chat history.
```

## Good Result

The new chat can start from the formal state, not from guesswork. It knows what
is confirmed, what is pending, and what must not be reopened unless new evidence
requires it.
