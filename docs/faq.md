# FAQ

## Is ACH just another prompt?

No. A prompt gives the agent wording for one interaction. ACH gives the agent a
routing rule for long-running work:

- stay lightweight while the task is simple
- stabilize the boundary when drift appears
- enter formal continuity only when recovery or handoff requires it

The value is not a magic phrase. The value is deciding when chat history is no
longer a safe place to hold the task state.

## Is ACH a replacement for AGENTS.md?

No. `AGENTS.md` is the right place for project-level instructions. ACH is the
right layer for task-level continuity.

Use `AGENTS.md` to tell an agent how to work in a repository. Use ACH when a
specific task must survive drift, interruption, handoff, or a new chat.

## Why not use LangGraph or another agent framework?

Use an agent framework when you need to build execution graphs, tools, agents,
or runtime systems. ACH does not try to do that.

ACH is smaller. It is for collaboration continuity inside the agent workflow
you already use.

## Why not use a memory system?

Memory stores information. ACH controls which information should become formal
task state.

That distinction matters because long-running tasks fail when:

- assumptions are stored as facts
- pending items are treated as decisions
- stale decisions survive after new constraints appear
- too much low-value context becomes permanent

ACH keeps the recovery state small and structured.

## Does ACH guarantee the model will never drift?

No. ACH is a harness, not a proof system.

It improves the odds by making drift, handoff, and recovery explicit operating
states. The remaining risk is execution quality: the model must still follow
the skill correctly.

## When is ACH too heavy?

ACH is too heavy when the task is short, local, and low-risk.

Use normal conversation for simple work. Use ACH when losing the task line would
cost more than the overhead of stabilizing it.
