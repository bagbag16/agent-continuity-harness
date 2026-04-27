# Claude Code

ACH can be used with Claude Code as a lightweight continuity contract around a
workspace.

## Setup

Keep this repository available in the workspace or as a local tool, then use
the CLI to create and validate state roots:

```bash
node path/to/agent-continuity-harness/bin/ach.js init <task-key>
node path/to/agent-continuity-harness/bin/ach.js preflight <task-key>
```

## Operating Rule

Tell the agent to recover from `.cca-bindings.json` and the bound
`.cca-state/<task-key>/` before continuing long-running work.

The important boundary is:

- project instructions describe how to edit the codebase
- ACH state describes the current task, confirmed constraints, pending items,
  and decisions

Do not merge these into one large instruction file. That makes every resume
pay for context it may not need.

