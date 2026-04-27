#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

function runStep(title, args, expectedStatus = 0) {
  console.log(`\n## ${title}\n`);
  console.log(`$ node ${args.join(" ")}`);

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  const output = [result.stdout.trim(), result.stderr.trim()]
    .filter(Boolean)
    .join("\n")
    .trim();

  if (output) console.log(output);

  if (result.status !== expectedStatus) {
    console.error(`\nExpected exit ${expectedStatus}, got ${result.status}.`);
    process.exit(result.status || 1);
  }
}

console.log("ACH 30-second recovery demo");
console.log("This shows the failure ACH catches, then the formal state path used for recovery.");

runStep(
  "Broken recovery state is rejected",
  ["bin/ach.js", "validate", "examples/fixtures/invalid-missing-file", "--json"],
  1,
);

runStep(
  "Valid ACH state is accepted",
  ["bin/ach.js", "validate", "examples/fixtures/valid-basic"],
);

runStep(
  "Handoff is generated from formal state",
  ["bin/ach.js", "handoff", "demo-task", "--root", "examples/fixtures/valid-basic"],
);

