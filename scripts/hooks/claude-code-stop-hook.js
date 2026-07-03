#!/usr/bin/env node
// Claude Code Stop hook: refuse to end the turn while ACH state is behind reality.
//
// Wiring (settings.json):
//   {
//     "hooks": {
//       "Stop": [
//         { "hooks": [ { "type": "command",
//             "command": "node <path-to-repo>/scripts/hooks/claude-code-stop-hook.js" } ] }
//       ]
//     }
//   }
//
// Behavior:
// - Reads the Stop-hook JSON from stdin. If stop_hook_active is true (Claude is
//   already continuing because this hook blocked once), exits 0 to avoid loops.
// - Finds .cca-bindings.json in the session cwd. No bindings -> exits 0.
// - Enforces only ACTIVE tasks: by default, tasks whose state root was modified
//   within the last ACH_STOP_HOOK_ACTIVE_HOURS (default 24). Dormant tasks are
//   skipped so old bindings never brick a session. Set ACH_TASK_KEY to pin one task.
// - Runs `ach reconcile` per enforced task with ACH_STOP_HOOK_GRACE_MINUTES
//   (default 15). Any DRIFT -> exit 2; stderr tells Claude what to record.
// - Fails open on unexpected errors (exit 0 with a note) so a broken hook never
//   locks the session. Set ACH_STOP_HOOK_DISABLE=1 to turn the gate off.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ACH_CLI = path.join(__dirname, "..", "..", "bin", "ach.js");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch (error) {
    return "";
  }
}

function newestMtimeUnder(dir) {
  let newest = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return newest;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeUnder(full));
    } else if (entry.isFile()) {
      try {
        newest = Math.max(newest, fs.lstatSync(full).mtimeMs);
      } catch (error) {
        /* ignore unreadable files */
      }
    }
  }
  return newest;
}

function main() {
  if (process.env.ACH_STOP_HOOK_DISABLE === "1") return 0;

  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch (error) {
    input = {};
  }
  if (input.stop_hook_active) return 0;

  const root = path.resolve(input.cwd || process.cwd());
  const bindingsPath = path.join(root, ".cca-bindings.json");
  if (!fs.existsSync(bindingsPath)) return 0;

  let bindings;
  try {
    bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8")).bindings || {};
  } catch (error) {
    return 0;
  }

  const pinnedTask = process.env.ACH_TASK_KEY || "";
  const activeHours = Number(process.env.ACH_STOP_HOOK_ACTIVE_HOURS || 24);
  const graceMinutes = Number(process.env.ACH_STOP_HOOK_GRACE_MINUTES || 15);
  const activeCutoffMs = Date.now() - Math.max(0, activeHours) * 3600000;

  const enforced = [];
  for (const [taskKey, binding] of Object.entries(bindings)) {
    if (pinnedTask && taskKey !== pinnedTask) continue;
    const stateRoot = path.resolve(root, binding.formal_state_root || "");
    if (!stateRoot.startsWith(root) || !fs.existsSync(stateRoot)) continue;
    if (!pinnedTask && newestMtimeUnder(stateRoot) < activeCutoffMs) continue; // dormant
    enforced.push(taskKey);
  }
  if (enforced.length === 0) return 0;

  const blocked = [];
  for (const taskKey of enforced) {
    const result = spawnSync(process.execPath, [
      ACH_CLI,
      "reconcile",
      taskKey,
      "--root",
      root,
      "--grace-minutes",
      String(graceMinutes),
      "--json",
    ], { encoding: "utf8" });

    if (result.status === 0) continue;

    let payload = null;
    try {
      payload = JSON.parse(result.stdout);
    } catch (error) {
      payload = null;
    }
    if (!payload) continue; // reconcile itself failed: fail open, not closed

    blocked.push(
      `ACH task "${taskKey}": ${payload.drift_file_count} file(s) changed after its state root ` +
      `(state last modified ${payload.state_last_modified}). ` +
      `Newest: ${payload.drift_examples.map((example) => example.path).slice(0, 3).join(", ")}.`,
    );
  }

  if (blocked.length === 0) return 0;

  process.stderr.write(
    "ACH stop gate: the formal state is behind the work you just did.\n" +
    blocked.join("\n") +
    "\nBefore finishing, record reality into the state root, e.g.:\n" +
    enforced.map((taskKey) => `  node ${ACH_CLI} checkpoint ${taskKey} --file pending-items --append "<what changed>"`).join("\n") +
    "\nThen stop again. (This gate does not re-fire on the retry.)\n",
  );
  return 2;
}

process.exitCode = main();
