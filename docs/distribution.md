# Distribution Notes

Use this file when publishing or sharing ACH.

The public message should stay simple:

> ACH is continuity for AI agent work that outgrows one chat.

## GitHub Metadata

Suggested repository description:

```text
Continuity for AI agent work that outgrows one chat.
```

Suggested topics:

```text
ai-agents
codex
agent-skills
long-running-agents
context-engineering
handoff
guardrails
agent-continuity
```

Social preview direction:

```text
ACH
Continuity for AI agent work that outgrows one chat
Drift control -> handoff -> recovery
```

## Short Launch Post

```text
I published ACH: continuity for AI agent work that outgrows one chat.

It is for the point where goals drift, assumptions become facts, handoffs lose
state, and the next session has to reconstruct what already happened.

ACH gives the agent one public entry and two internal modes:
- stay lightweight by default
- enter formal continuity only when recovery or handoff needs it

Repo: <repo-url>
```

## Technical Launch Note

```text
ACH is not an agent framework, prompt collection, or memory database.

It is a small continuity harness for existing AI agent workflows. The core idea
is to keep task state structured only when the task actually needs it: current
goal, confirmed constraints, pending items, decisions, and handoff state.

Use it when the failure mode is not missing capability, but broken continuity.
```

## Objection Responses

### "Isn't this just AGENTS.md?"

No. `AGENTS.md` gives project-level instructions. ACH handles task-level
continuity during long-running work.

Use both together.

### "Why not just use an agent framework?"

Use an agent framework when you need execution graphs, tools, or runtime
systems. Use ACH when the collaboration state itself is drifting or needs
handoff.

### "Does this guarantee the model will follow it?"

No. ACH is a harness, not a proof system. It improves the operating boundary by
making drift, handoff, and recovery explicit.

### "When is ACH too much?"

ACH is too much for short, obvious, low-risk work. It is useful when losing the
task line would cost more than stabilizing it.
