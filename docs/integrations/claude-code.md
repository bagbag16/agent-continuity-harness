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

## Stop Gate (mechanical enforcement)

Prose asks the agent to keep state fresh; the stop gate refuses to end the
turn while state is stale. It converts the weakest rule in this system —
"remember to checkpoint" — into a door that will not close.

Wire the bundled hook into `settings.json` (project `.claude/settings.json`
or user `~/.claude/settings.json`):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node <path-to-repo>/scripts/hooks/claude-code-stop-hook.js"
          }
        ]
      }
    ]
  }
}
```

Behavior:

- On every stop, the hook runs `ach reconcile` for each **active** task bound
  in the session cwd (active = state root modified within the last 24 hours,
  so dormant bindings never brick a session).
- If workspace files changed after the state root (beyond a 15-minute grace),
  the hook exits 2: Claude is not allowed to finish, and stderr tells it
  exactly what to record.
- `stop_hook_active` is honored, so the gate fires at most once per stop chain
  and can never loop.
- Fails open on unexpected errors. Environment knobs:
  `ACH_TASK_KEY` (pin one task), `ACH_STOP_HOOK_GRACE_MINUTES` (default 15),
  `ACH_STOP_HOOK_ACTIVE_HOURS` (default 24), `ACH_STOP_HOOK_DISABLE=1`.

`ach reconcile <task-key>` is also useful standalone: it derives drift from
file mtimes — ground truth — instead of trusting what the agent says it did.

