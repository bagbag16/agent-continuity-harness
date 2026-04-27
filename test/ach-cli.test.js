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

test("manifest schema errors are reported", () => {
  const temp = copyFixture("valid-basic");
  const manifestPath = path.join(temp, ".cca-state", "demo-task", "state-manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  delete manifest.integrity_status;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = run(["validate", temp, "--json"]);
  assert.equal(result.status, 1);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.errors.some((error) => error.code === "ACH_MANIFEST_SCHEMA"));
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

test("handoff is derived from formal state", () => {
  const result = run(["handoff", "demo-task", "--root", "examples/fixtures/valid-basic"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /This handoff is derived from the ACH formal state root/);
  assert.match(result.stdout, /Prepare a small ACH recovery demo/);
});

test("documented error codes cover CLI emitted codes", () => {
  const cliText = fs.readFileSync(cli, "utf8");
  const docsText = fs.readFileSync(path.join(repoRoot, "docs", "error-codes.md"), "utf8");
  const codes = [...new Set(cliText.match(/ACH_[A-Z_]+/g) || [])];

  for (const code of codes) {
    assert.match(docsText, new RegExp(`### \`${code}\``), `${code} is missing from docs/error-codes.md`);
  }
});
