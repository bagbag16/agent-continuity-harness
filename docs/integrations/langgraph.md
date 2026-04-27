# LangGraph

ACH is not a LangGraph state replacement. Use it around graph-based workflows
when the human-agent collaboration needs resumable task intent.

## Boundary

- LangGraph state tracks runtime graph execution.
- ACH state tracks task continuity: current goal, confirmed constraints,
  pending items, and decisions.

Keep those states separate unless a node explicitly needs to read or write ACH
continuity state.

## Useful Touchpoints

- Run `ach preflight <task-key>` before resuming a paused graph workflow.
- Generate `ach handoff <task-key>` when a graph run must be handed to a human
  or another agent.
- Treat schema or manifest errors as recovery blockers.

This keeps ACH as a small recovery contract instead of turning it into another
orchestration layer.

