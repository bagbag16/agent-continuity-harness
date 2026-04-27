# Integrations

ACH integration should stay thin. The goal is to preserve task continuity, not
to replace the host tool's project instructions, memory, runtime, or graph
state.

Use the same pattern everywhere:

1. Keep ACH as one public concept: Agent Continuity Harness, invoked as `ach`.
2. Use the CLI to validate formal state roots when durable recovery matters.
3. Keep `.cca-bindings.json` and `.cca-state/<task-key>/` as the continuity
   source of truth.
4. Do not expose `guard-mode` and `continuity-mode` as separate user products.

Available notes:

- [Codex](codex.md)
- [Claude Code](claude-code.md)
- [Cursor](cursor.md)
- [LangGraph](langgraph.md)

