const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const cli = path.join(repoRoot, "bin", "ach.js");

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function copyFixture(name) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ach-test-"));
  fs.cpSync(path.join(repoRoot, "examples", "fixtures", name), temp, { recursive: true });
  return temp;
}

function manifestPath(fixtureRoot) {
  return path.join(fixtureRoot, ".cca-state", "demo-task", "state-manifest.json");
}

function readManifest(fixtureRoot) {
  return JSON.parse(fs.readFileSync(manifestPath(fixtureRoot), "utf8"));
}

function writeManifest(fixtureRoot, manifest) {
  fs.writeFileSync(manifestPath(fixtureRoot), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

test("valid fixture passes validation", () => {
  const result = run(["validate", "examples/fixtures/valid-basic", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.checked[0].task_key, "demo-task");
});

test("missing file fixture fails validation", () => {
  const result = run(["validate", "examples/fixtures/invalid-missing-file", "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_REQUIRED_FILE_MISSING"));
});

test("manifest mismatch fixture fails validation", () => {
  const result = run(["validate", "examples/fixtures/invalid-manifest-mismatch", "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_MANIFEST_TASK_MISMATCH"));
});

test("bindings schema errors are reported", () => {
  const temp = copyFixture("valid-basic");
  const bindingsPath = path.join(temp, ".cca-bindings.json");
  const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
  bindings.bindings["demo-task"].formal_state_root = "state/demo-task";
  fs.writeFileSync(bindingsPath, `${JSON.stringify(bindings, null, 2)}\n`);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_BINDINGS_SCHEMA"));
});

test("task-scoped validation ignores unrelated invalid bindings", () => {
  const temp = copyFixture("valid-basic");
  const bindingsPath = path.join(temp, ".cca-bindings.json");
  const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
  bindings.bindings["unrelated-task"] = { formal_state_root: "legacy-state-root" };
  fs.writeFileSync(bindingsPath, `${JSON.stringify(bindings, null, 2)}\n`);

  const scoped = run(["validate", temp, "--task", "demo-task", "--json"]);
  assert.equal(scoped.status, 0, scoped.stderr || scoped.stdout);
  const scopedParsed = JSON.parse(scoped.stdout);
  assert.equal(scopedParsed.ok, true);
  assert.equal(scopedParsed.checked.length, 1);
  assert.equal(scopedParsed.checked[0].task_key, "demo-task");

  const full = run(["validate", temp, "--json"]);
  assert.equal(full.status, 1);
  const fullParsed = JSON.parse(full.stdout);
  assert.ok(fullParsed.errors.some((error) => error.code === "ACH_BINDINGS_SCHEMA"));
});

test("manifest schema errors are reported", () => {
  const temp = copyFixture("valid-basic");
  const manifest = readManifest(temp);
  delete manifest.integrity_status;
  writeManifest(temp, manifest);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_MANIFEST_SCHEMA"));
});

test("nonblocking missing supplemental documents warn without failing validation", () => {
  const temp = copyFixture("valid-basic");
  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: false,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.ok(parsed.warnings.some((warning) => warning.code === "ACH_SUPPLEMENTAL_DOCUMENT_MISSING"));
});

test("blocking missing supplemental documents fail validation", () => {
  const temp = copyFixture("valid-basic");
  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: true,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_SUPPLEMENTAL_DOCUMENT_MISSING"));
});

test("blocking active-context missing required sections fails validation", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(path.join(stateRoot, "active-context.md"), "# active-context\n\n## Current Route\n\n- active_route: R1\n", "utf8");

  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: true,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_ACTIVE_CONTEXT_MISSING_SECTION"));
});

test("manifest artifact-index validator checks active-context artifact references", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(
    path.join(stateRoot, "active-context.md"),
    [
      "# active-context",
      "",
      "## Current Route",
      "",
      "- active_route: `R1`",
      "",
      "## Active Rules",
      "",
      "- keep current route",
      "",
      "## Active Artifacts",
      "",
      "- `missing-current-artifact.md`",
      "",
      "## Current Blockers",
      "",
      "- none",
      "",
      "## Read Next",
      "",
      "- current-goal.md",
      "",
    ].join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(stateRoot, "artifact-provenance-index.md"),
    [
      "# artifact-provenance-index",
      "",
      "## Artifacts",
      "",
      "### A-001",
      "",
      "- path: `.cca-state/demo-task/current-goal.md`",
      "- kind: summary",
      "- produced_by: test",
      "- mouth: current R1",
      "- status: active",
      "- valid_when: test",
      "- invalid_when:",
      "- replacement:",
      "- depends_on:",
      "  - A-404",
      "",
    ].join("\n"),
    "utf8",
  );

  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: true,
    },
    {
      id: "S2",
      path: "artifact-provenance-index.md",
      role: "artifact-provenance-index",
      status: "active",
      default_read: false,
      read_when: "Read when checking artifact validity.",
      blocks_recovery_if_missing: false,
    },
  ];
  manifest.validators = [
    {
      id: "V1",
      type: "artifact-index",
      target: "artifact-provenance-index.md",
      active_context: "active-context.md",
      status: "active",
      blocks_recovery_if_failed: true,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_ARTIFACT_INDEX_INVALID"));
  assert.ok(parsed.errors.some((error) => error.message.includes("A-404")));
});

test("init creates a bound valid state root", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ach-test-"));
  const init = run(["init", "new-task", "--root", temp]);
  assert.equal(init.status, 0, init.stderr || init.stdout);

  const validate = run(["validate", temp, "--task", "new-task", "--json"]);
  assert.equal(validate.status, 0, validate.stderr || validate.stdout);
  const parsed = JSON.parse(validate.stdout);
  assert.equal(parsed.ok, true);
});

test("list reports bound tasks with validation state", () => {
  const result = run(["list", "examples/fixtures/valid-basic", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.tasks.length, 1);
  assert.equal(parsed.tasks[0].task_key, "demo-task");
  assert.equal(parsed.tasks[0].valid, true);
});

test("list succeeds when old bindings are invalid but health fails", () => {
  const temp = copyFixture("valid-basic");
  const bindingsPath = path.join(temp, ".cca-bindings.json");
  const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
  bindings.bindings["old-task"] = { formal_state_root: "missing-state-root" };
  fs.writeFileSync(bindingsPath, `${JSON.stringify(bindings, null, 2)}\n`);

  const list = run(["list", temp, "--json"]);
  assert.equal(list.status, 0, list.stderr || list.stdout);
  const listed = JSON.parse(list.stdout);
  assert.equal(listed.tasks.length, 2);
  assert.ok(listed.tasks.some((task) => task.task_key === "old-task" && task.valid === false));

  const health = run(["health", temp, "--json"]);
  assert.equal(health.status, 1);
  const checked = JSON.parse(health.stdout);
  assert.equal(checked.ok, false);
});

test("status returns a machine-readable recovery view", () => {
  const result = run(["status", "demo-task", "--root", "examples/fixtures/valid-basic", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.task_key, "demo-task");
  assert.equal(parsed.ready, true);
  assert.ok(parsed.recovery_core.current_goal.includes("Prepare a small ACH recovery demo"));
});

test("status --brief returns a short status line", () => {
  const result = run(["status", "demo-task", "--root", "examples/fixtures/valid-basic", "--brief"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ACH demo-task: ready/);
});

test("record appends structured pending item", () => {
  const temp = copyFixture("valid-basic");
  const result = run(["record", "demo-task", "--root", temp, "--type", "pending", "--text", "Confirm next release tag.", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.file, "pending-items.md");
  const pending = fs.readFileSync(path.join(temp, ".cca-state", "demo-task", "pending-items.md"), "utf8");
  assert.match(pending, /Confirm next release tag/);
});

test("check-write flags active-context outside the default read path", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(
    path.join(stateRoot, "active-context.md"),
    [
      "# active-context",
      "",
      "## Current Route",
      "",
      "- active_route: `R1`",
      "",
      "## Active Rules",
      "",
      "- keep current route",
      "",
      "## Active Artifacts",
      "",
      "- none",
      "",
      "## Current Blockers",
      "",
      "- none",
      "",
      "## Read Next",
      "",
      "- current-goal.md",
      "",
    ].join("\n"),
    "utf8",
  );

  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: false,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: false,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["check-write", "demo-task", "--root", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.closure_errors.some((issue) => issue.includes("not default_read")));
});

test("repair --safe fixes active-context default read path", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(
    path.join(stateRoot, "active-context.md"),
    [
      "# active-context",
      "",
      "## Current Route",
      "",
      "- active_route: `R1`",
      "",
      "## Active Rules",
      "",
      "- keep current route",
      "",
      "## Active Artifacts",
      "",
      "- none",
      "",
      "## Current Blockers",
      "",
      "- none",
      "",
      "## Read Next",
      "",
      "- current-goal.md",
      "",
    ].join("\n"),
    "utf8",
  );
  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: false,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: false,
    },
  ];
  writeManifest(temp, manifest);

  const repair = run(["repair", "demo-task", "--root", temp, "--safe", "--json"]);
  assert.equal(repair.status, 0, repair.stderr || repair.stdout);
  const repairedManifest = readManifest(temp);
  const activeContext = repairedManifest.supplemental_documents.find((document) => document.role === "active-context");
  assert.equal(activeContext.default_read, true);
  assert.equal(activeContext.blocks_recovery_if_missing, true);

  const check = run(["check-write", "demo-task", "--root", temp, "--json"]);
  assert.equal(check.status, 0, check.stderr || check.stdout);
});

test("add-supplemental creates and registers active-context", () => {
  const temp = copyFixture("valid-basic");
  const result = run(["add-supplemental", "demo-task", "--root", temp, "--role", "active-context", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.entry.role, "active-context");
  assert.ok(fs.existsSync(path.join(temp, ".cca-state", "demo-task", "active-context.md")));

  const manifest = readManifest(temp);
  assert.ok(manifest.supplemental_documents.some((document) => document.role === "active-context"));

  const validate = run(["validate", temp, "--task", "demo-task", "--json"]);
  assert.equal(validate.status, 0, validate.stderr || validate.stdout);
});

test("artifact add creates an index entry and artifact check validates it", () => {
  const temp = copyFixture("valid-basic");
  const add = run([
    "artifact",
    "add",
    "demo-task",
    "--root",
    temp,
    "--id",
    "A-001",
    "--path",
    ".cca-state/demo-task/current-goal.md",
    "--kind",
    "summary",
    "--produced-by",
    "test",
    "--mouth",
    "current",
    "--source-paths",
    ".cca-state/demo-task/current-goal.md",
    "--json",
  ]);
  assert.equal(add.status, 0, add.stderr || add.stdout);
  const added = JSON.parse(add.stdout);
  assert.equal(added.artifact.id, "A-001");

  const check = run(["artifact", "check", "demo-task", "--root", temp, "--json"]);
  assert.equal(check.status, 0, check.stderr || check.stdout);
  const checked = JSON.parse(check.stdout);
  assert.equal(checked.ok, true);
  assert.equal(checked.artifacts[0].id, "A-001");

  const validate = run(["validate", temp, "--task", "demo-task", "--json"]);
  assert.equal(validate.status, 0, validate.stderr || validate.stdout);
});

test("pause combines status, write closure, and compact handoff", () => {
  const result = run(["pause", "demo-task", "--root", "examples/fixtures/valid-basic", "--json"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ready, true);
  assert.equal(parsed.status.ready, true);
  assert.equal(parsed.check_write.ok, true);
  assert.match(parsed.handoff, /ACH Handoff: demo-task/);
});

test("handoff is derived from formal state", () => {
  const result = run(["handoff", "demo-task", "--root", "examples/fixtures/valid-basic"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /This handoff is derived from the ACH formal state root/);
  assert.match(result.stdout, /Compact mode shows/);
  assert.match(result.stdout, /Prepare a small ACH recovery demo/);
});

test("handoff --full renders the complete derived view", () => {
  const result = run(["handoff", "demo-task", "--root", "examples/fixtures/valid-basic", "--full"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /This handoff is derived from the ACH formal state root/);
  assert.doesNotMatch(result.stdout, /Compact mode shows/);
  assert.match(result.stdout, /## Decisions/);
});

test("handoff rejects mutually exclusive compact and full flags", () => {
  const result = run(["handoff", "demo-task", "--root", "examples/fixtures/valid-basic", "--compact", "--full"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Use either --compact or --full, not both/);
});

test("handoff lists supplemental documents and includes active-context content", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(path.join(stateRoot, "active-context.md"), "# active-context\n\nactive_route: R1\n", "utf8");

  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: false,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["handoff", "demo-task", "--root", temp]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /## Active Context/);
  assert.match(result.stdout, /## Supplemental Documents/);
  assert.match(result.stdout, /role=active-context/);
  assert.match(result.stdout, /active_route: R1/);
});

test("compact handoff prioritizes active-context semantic sections", () => {
  const temp = copyFixture("valid-basic");
  const stateRoot = path.join(temp, ".cca-state", "demo-task");
  fs.writeFileSync(
    path.join(stateRoot, "current-goal.md"),
    "# current-goal\n\n## Current Task\n\n- SHOULD_NOT_APPEAR_IN_COMPACT_WHEN_ACTIVE_CONTEXT_EXISTS\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(stateRoot, "active-context.md"),
    "# active-context\n\n## Current Route\n\n- active_route: R2\n\n## Current Blockers\n\n- blocker: confirm artifact mouth\n",
    "utf8",
  );

  const manifest = readManifest(temp);
  manifest.supplemental_documents = [
    {
      id: "S1",
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: "Read before resuming complex branch work.",
      blocks_recovery_if_missing: false,
    },
  ];
  writeManifest(temp, manifest);

  const result = run(["handoff", "demo-task", "--root", temp]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /## Active Context/);
  assert.match(result.stdout, /### Current Route/);
  assert.match(result.stdout, /active_route: R2/);
  assert.match(result.stdout, /blocker: confirm artifact mouth/);
  assert.doesNotMatch(result.stdout, /SHOULD_NOT_APPEAR_IN_COMPACT/);
});

test("per-command --help prints usage for known command and exits 0", () => {
  const result = run(["init", "--help"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ach init <task-key>/);
  assert.doesNotMatch(result.stdout, /Missing value for --help/);
});

test("per-command --help on unknown command falls back to full help", () => {
  const result = run(["bogus-command", "--help"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ACH CLI/);
  assert.match(result.stdout, /ach init <task-key>/);
});

test("per-command -h short flag works the same as --help", () => {
  const result = run(["status", "-h"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ach status <task-key>/);
});

test("documented error codes cover CLI emitted codes", () => {
  const cliText = fs.readFileSync(cli, "utf8");
  const docsText = fs.readFileSync(path.join(repoRoot, "docs", "error-codes.md"), "utf8");
  const codes = [...new Set(cliText.match(/ACH_[A-Z_]+/g) || [])];

  for (const code of codes) {
    assert.match(docsText, new RegExp(`### \`${code}\``), `${code} is missing from docs/error-codes.md`);
  }
});
