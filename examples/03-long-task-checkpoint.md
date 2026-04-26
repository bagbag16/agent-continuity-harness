# Long-Task Checkpoint

## Failure Pattern

A task spans multiple phases. The current phase finishes, but the next phase
inherits a messy mix of decisions, assumptions, side notes, and unfinished work.

## Without ACH

The agent may treat the entire chat as equally authoritative:

- old ideas remain alive after being rejected
- decisions are hard to distinguish from suggestions
- the next phase starts with stale assumptions
- recovery depends on rereading a long transcript

## With ACH

ACH creates a semantic checkpoint at the phase boundary.

Expected behavior:

- close the current phase with a compact state update
- record decisions separately from pending items
- preserve only high-impact continuation state
- keep the next phase lightweight unless formal continuity is needed

## Example Prompt

```text
Use ACH. We are finishing this phase.
Create a checkpoint that preserves the goal, confirmed constraints,
decisions, and pending items for the next phase.
```

## Good Result

The next phase starts from a clean continuation state instead of a long,
ambiguous transcript.
