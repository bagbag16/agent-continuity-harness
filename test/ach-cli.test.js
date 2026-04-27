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
