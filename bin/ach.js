#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REQUIRED_FILES = [
  "current-goal.md",
  "confirmed-constraints.md",
  "pending-items.md",
  "decisions.md",
  "state-manifest.json",
];

const STATE_MD_FILES = {
  "current-goal": "current-goal.md",
  "confirmed-constraints": "confirmed-constraints.md",
  "pending-items": "pending-items.md",
  decisions: "decisions.md",
};

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  try {
    switch (command) {
      case "init":
        return cmdInit(args);
      case "bind":
        return cmdBind(args);
      case "validate":
        return cmdValidate(args);
      case "checkpoint":
        return cmdCheckpoint(args);
      case "handoff":
        return cmdHandoff(args);
      case "preflight":
      case "resume":
        return cmdPreflight(args, command);
      case "-h":
      case "--help":
      case "help":
      case undefined:
        printHelp();
        return 0;
      default:
        throw new CliError(`Unknown command: ${command}`, 2);
    }
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      return error.exitCode;
    }
    console.error(error.stack || String(error));
    return 1;
  }
}

function parseArgs(tokens) {
  const parsed = { _: [] };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }

    const [flag, inlineValue] = token.split("=", 2);
    if (["--json", "--dry-run", "--no-bind"].includes(flag)) {
      parsed[flag.slice(2).replace(/-/g, "_")] = true;
      continue;
    }

    const key = flag.slice(2).replace(/-/g, "_");
    const value = inlineValue !== undefined ? inlineValue : tokens[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new CliError(`Missing value for ${flag}`, 2);
    }
    parsed[key] = value;
    if (inlineValue === undefined) index += 1;
  }
  return parsed;
}

function cmdInit(args) {
  const taskKey = requireArg(args._[0], "task key");
  assertTaskKey(taskKey);
  const root = normalizeRoot(args.root);
  const stateRootRel = toPosix(path.join(".cca-state", taskKey));
  const stateRoot = resolveInside(root, stateRootRel);

  const files = {
    "current-goal.md": `# current-goal

## Current Task

- ${taskKey}

## Current Phase

- Initialized.

## Next Step

- Fill the state root before handoff or recovery.
`,
    "confirmed-constraints.md": `# confirmed-constraints

## Active Constraints

- Currently empty.
`,
    "pending-items.md": `# pending-items

## Items

- Pending content: currently empty.
- Impact scope: none.
- Blocks current progress: no.
- Provisional continuation: continue normal work until a high-impact pending item appears.
`,
    "decisions.md": `# decisions

## Current Decisions

- id: D1
  decision: "Initialize ACH formal state root."
  change-type: add
  affects: "Task recovery"
  basis: "ACH init created the minimum formal state files."
`,
    "state-manifest.json": `${JSON.stringify(
      {
        version: 1,
        task_key: taskKey,
        formal_state_root: stateRootRel,
        active_mode: "continuity-mode",
        active_packs: [],
        supplemental_documents: [],
        last_handoff: null,
        superseded_roots: [],
        integrity_status: "ok",
      },
      null,
      2,
    )}\n`,
  };

  if (args.dry_run) {
    printJsonOrText(args, {
      action: "init",
      task_key: taskKey,
      state_root: stateRootRel,
      files: Object.keys(files),
      bind: !args.no_bind,
    }, `Would create ${stateRootRel} with ${Object.keys(files).length} files.`);
    return 0;
  }

  fs.mkdirSync(stateRoot, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(stateRoot, file);
    if (!fs.existsSync(target)) fs.writeFileSync(target, content, "utf8");
  }

  if (!args.no_bind) {
    writeBinding(root, taskKey, stateRootRel);
  }

  console.log(`Initialized ACH state root: ${stateRootRel}`);
  if (!args.no_bind) console.log(`Bound task key: ${taskKey}`);
  return 0;
}

function cmdBind(args) {
  const taskKey = requireArg(args._[0], "task key");
  const stateRootInput = requireArg(args._[1], "state root");
  assertTaskKey(taskKey);
  const root = normalizeRoot(args.root);
  const stateRootRel = normalizeStateRoot(root, stateRootInput);

  if (args.dry_run) {
    printJsonOrText(args, {
      action: "bind",
      task_key: taskKey,
      formal_state_root: stateRootRel,
    }, `Would bind ${taskKey} -> ${stateRootRel}`);
    return 0;
  }

  writeBinding(root, taskKey, stateRootRel);
  console.log(`Bound ${taskKey} -> ${stateRootRel}`);
  return 0;
}

function cmdValidate(args) {
  const root = normalizeRoot(args.root || args._[0]);
  const result = validateWorkspace(root, args.task);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printValidation(result);
  }
  return result.ok ? 0 : 1;
}

function cmdCheckpoint(args) {
  const taskKey = requireArg(args._[0], "task key");
  const stateFile = args.file || args.section;
  const appendText = args.append || args.message;
  if (!stateFile || !STATE_MD_FILES[stateFile]) {
    throw new CliError(`--file must be one of: ${Object.keys(STATE_MD_FILES).join(", ")}`, 2);
  }
  if (!appendText) throw new CliError("checkpoint requires --append <text>", 2);

  const root = normalizeRoot(args.root);
  const binding = getBinding(root, taskKey);
  const filePath = path.join(resolveInside(root, binding.formal_state_root), STATE_MD_FILES[stateFile]);
  const entry = `\n\n## Checkpoint ${new Date().toISOString()}\n\n${appendText}\n`;

  if (args.dry_run) {
    printJsonOrText(args, {
      action: "checkpoint",
      task_key: taskKey,
      file: STATE_MD_FILES[stateFile],
      append: appendText,
    }, `Would append checkpoint to ${STATE_MD_FILES[stateFile]}.`);
    return 0;
  }

  fs.appendFileSync(filePath, entry, "utf8");
  console.log(`Updated ${STATE_MD_FILES[stateFile]} for ${taskKey}`);
  return 0;
}

function cmdHandoff(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const result = validateWorkspace(root, taskKey);
  if (!result.ok) {
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printValidation(result);
    return 1;
  }

  const binding = getBinding(root, taskKey);
  const stateRoot = resolveInside(root, binding.formal_state_root);
  const payload = {
    task_key: taskKey,
    formal_state_root: binding.formal_state_root,
    source: "ACH formal state root",
    generated_at: new Date().toISOString(),
    current_goal: readFile(path.join(stateRoot, "current-goal.md")),
    confirmed_constraints: readFile(path.join(stateRoot, "confirmed-constraints.md")),
    pending_items: readFile(path.join(stateRoot, "pending-items.md")),
    decisions: readFile(path.join(stateRoot, "decisions.md")),
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(renderHandoff(payload));
  }
  return 0;
}

function cmdPreflight(args, command) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const result = validateWorkspace(root, taskKey);
  const payload = {
    task_key: taskKey,
    command,
    ready: result.ok,
    checked: result.checked,
    errors: result.errors,
    warnings: result.warnings,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (result.ok) {
    console.log(`ACH ${command} ready for ${taskKey}.`);
    console.log("Recover from current-goal, confirmed-constraints, pending-items, and decisions before continuing.");
  } else {
    printValidation(result);
  }
  return result.ok ? 0 : 1;
}

function validateWorkspace(root, taskFilter) {
  const result = { ok: true, root, checked: [], errors: [], warnings: [] };
  const bindingsPath = path.join(root, ".cca-bindings.json");
  const bindings = readJsonFile(bindingsPath, result, "ACH_BINDINGS_INVALID");
  if (!bindings) {
    addError(result, "ACH_BINDINGS_MISSING", ".cca-bindings.json is missing or invalid.", ".cca-bindings.json");
    return result;
  }

  validateSchemaFile("bindings.schema.json", bindings, result, "ACH_BINDINGS_SCHEMA", ".cca-bindings.json");

  if (bindings.version !== 1) {
    addError(result, "ACH_BINDINGS_VERSION", "bindings version must be 1.", ".cca-bindings.json");
  }
  if (!bindings.bindings || typeof bindings.bindings !== "object" || Array.isArray(bindings.bindings)) {
    addError(result, "ACH_BINDINGS_SHAPE", "bindings must be an object.", ".cca-bindings.json");
    return result;
  }

  const entries = Object.entries(bindings.bindings).filter(([key]) => !taskFilter || key === taskFilter);
  if (taskFilter && entries.length === 0) {
    addError(result, "ACH_TASK_NOT_BOUND", `Task key is not bound: ${taskFilter}`, ".cca-bindings.json");
    return result;
  }

  for (const [taskKey, binding] of entries) {
    validateBinding(root, taskKey, binding, result);
  }

  result.ok = result.errors.length === 0;
  return result;
}

function validateBinding(root, taskKey, binding, result) {
  if (!binding || typeof binding.formal_state_root !== "string") {
    addError(result, "ACH_BINDING_SHAPE", `Binding for ${taskKey} must include formal_state_root.`, ".cca-bindings.json");
    return;
  }

  let stateRoot;
  try {
    stateRoot = resolveInside(root, binding.formal_state_root);
  } catch (error) {
    addError(result, "ACH_STATE_ROOT_OUTSIDE_WORKSPACE", error.message, binding.formal_state_root);
    return;
  }

  const checked = { task_key: taskKey, formal_state_root: binding.formal_state_root };
  result.checked.push(checked);

  if (!fs.existsSync(stateRoot) || !fs.statSync(stateRoot).isDirectory()) {
    addError(result, "ACH_STATE_ROOT_MISSING", `State root does not exist: ${binding.formal_state_root}`, binding.formal_state_root);
    return;
  }

  for (const file of REQUIRED_FILES) {
    const target = path.join(stateRoot, file);
    if (!fs.existsSync(target)) {
      addError(result, "ACH_REQUIRED_FILE_MISSING", `Missing required file: ${file}`, toPosix(path.join(binding.formal_state_root, file)));
    } else if (file.endsWith(".md") && readFile(target).trim().length === 0) {
      addError(result, "ACH_STATE_FILE_EMPTY", `State file is empty: ${file}`, toPosix(path.join(binding.formal_state_root, file)));
    }
  }

  const manifestPath = path.join(stateRoot, "state-manifest.json");
  const manifest = readJsonFile(manifestPath, result, "ACH_MANIFEST_INVALID");
  if (!manifest) return;

  const manifestRelPath = toPosix(path.join(binding.formal_state_root, "state-manifest.json"));
  validateSchemaFile("state-manifest.schema.json", manifest, result, "ACH_MANIFEST_SCHEMA", manifestRelPath);

  if (manifest.version !== 1) {
    addError(result, "ACH_MANIFEST_VERSION", "state-manifest version must be 1.", manifestRelPath);
  }
  if (manifest.task_key !== taskKey) {
    addError(result, "ACH_MANIFEST_TASK_MISMATCH", `manifest task_key must be ${taskKey}.`, manifestRelPath);
  }
  if (normalizeRel(manifest.formal_state_root) !== normalizeRel(binding.formal_state_root)) {
    addError(result, "ACH_MANIFEST_ROOT_MISMATCH", "manifest formal_state_root must match binding.", manifestRelPath);
  }
  if (!["guard-mode", "continuity-mode"].includes(manifest.active_mode)) {
    addError(result, "ACH_MANIFEST_MODE", "active_mode must be guard-mode or continuity-mode.", manifestRelPath);
  }
  if (!Array.isArray(manifest.active_packs)) {
    addError(result, "ACH_MANIFEST_PACKS", "active_packs must be an array.", manifestRelPath);
  }
  if (!Array.isArray(manifest.superseded_roots)) {
    addError(result, "ACH_MANIFEST_SUPERSEDED_ROOTS", "superseded_roots must be an array.", manifestRelPath);
  }

  const extraFiles = fs.readdirSync(stateRoot).filter((name) => /handoff|summary|resume/i.test(name));
  for (const file of extraFiles) {
    addWarning(result, "ACH_DERIVED_VIEW_IN_STATE_ROOT", `Derived view appears inside formal state root: ${file}`, toPosix(path.join(binding.formal_state_root, file)));
  }
}

function writeBinding(root, taskKey, stateRootRel) {
  const bindingsPath = path.join(root, ".cca-bindings.json");
  let bindings = { version: 1, bindings: {} };
  if (fs.existsSync(bindingsPath)) {
    bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
    if (!bindings.bindings) bindings.bindings = {};
  }
  bindings.version = 1;
  bindings.bindings[taskKey] = { formal_state_root: normalizeRel(stateRootRel) };
  fs.writeFileSync(bindingsPath, `${JSON.stringify(bindings, null, 2)}\n`, "utf8");
}

function getBinding(root, taskKey) {
  const bindingsPath = path.join(root, ".cca-bindings.json");
  if (!fs.existsSync(bindingsPath)) throw new CliError(`Missing .cca-bindings.json in ${root}`, 1);
  const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
  const binding = bindings.bindings && bindings.bindings[taskKey];
  if (!binding) throw new CliError(`Task key is not bound: ${taskKey}`, 1);
  return binding;
}

function printValidation(result) {
  if (result.ok) {
    console.log(`ACH state is valid. Checked ${result.checked.length} binding(s).`);
  } else {
    console.log("ACH state is invalid.");
  }
  for (const error of result.errors) {
    console.log(`ERROR ${error.code}: ${error.message} (${error.path})`);
  }
  for (const warning of result.warnings) {
    console.log(`WARN ${warning.code}: ${warning.message} (${warning.path})`);
  }
}

function renderHandoff(payload) {
  return `# ACH Handoff: ${payload.task_key}

Source: ${payload.formal_state_root}
Generated: ${payload.generated_at}

This handoff is derived from the ACH formal state root. It is not a replacement
for current-goal, confirmed-constraints, pending-items, decisions, or the
state manifest.

## Current Goal

${payload.current_goal.trim()}

## Confirmed Constraints

${payload.confirmed_constraints.trim()}

## Pending Items

${payload.pending_items.trim()}

## Decisions

${payload.decisions.trim()}
`;
}

function readJsonFile(filePath, result, code) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(result, code, error.message, filePath);
    return null;
  }
}

function validateSchemaFile(schemaName, value, result, code, filePath) {
  const schemaPath = path.resolve(__dirname, "..", "schemas", schemaName);
  if (!fs.existsSync(schemaPath)) {
    addError(result, "ACH_SCHEMA_UNAVAILABLE", `Schema file is missing: ${schemaName}`, schemaPath);
    return;
  }

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (error) {
    addError(result, "ACH_SCHEMA_UNAVAILABLE", `Schema file is invalid: ${error.message}`, schemaPath);
    return;
  }

  const issues = [];
  validateSchemaNode(schema, value, "$", issues);
  for (const issue of issues) {
    addError(result, code, `${issue.path}: ${issue.message}`, filePath);
  }
}

function validateSchemaNode(schema, value, jsonPath, issues) {
  if (!schema || typeof schema !== "object") return;

  if (Object.prototype.hasOwnProperty.call(schema, "const") && value !== schema.const) {
    issues.push({ path: jsonPath, message: `expected ${JSON.stringify(schema.const)}` });
  }

  if (schema.enum && !schema.enum.includes(value)) {
    issues.push({ path: jsonPath, message: `expected one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}` });
  }

  if (schema.type && !matchesSchemaType(value, schema.type)) {
    issues.push({ path: jsonPath, message: `expected type ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}` });
    return;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      issues.push({ path: jsonPath, message: `expected minLength ${schema.minLength}` });
    }
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
      issues.push({ path: jsonPath, message: `expected pattern ${schema.pattern}` });
    }
  }

  if (Array.isArray(value)) {
    if (schema.items) {
      value.forEach((item, index) => validateSchemaNode(schema.items, item, `${jsonPath}[${index}]`, issues));
    }
    return;
  }

  if (!value || typeof value !== "object") return;

  const properties = schema.properties || {};
  if (schema.required) {
    for (const key of schema.required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push({ path: `${jsonPath}.${key}`, message: "is required" });
      }
    }
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      validateSchemaNode(childSchema, value[key], `${jsonPath}.${key}`, issues);
    }
  }

  for (const key of Object.keys(value)) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
    if (schema.additionalProperties === false) {
      issues.push({ path: `${jsonPath}.${key}`, message: "is not allowed" });
    } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      validateSchemaNode(schema.additionalProperties, value[key], `${jsonPath}.${key}`, issues);
    }
  }
}

function matchesSchemaType(value, expected) {
  const types = Array.isArray(expected) ? expected : [expected];
  return types.some((type) => {
    switch (type) {
      case "array":
        return Array.isArray(value);
      case "boolean":
        return typeof value === "boolean";
      case "integer":
        return Number.isInteger(value);
      case "null":
        return value === null;
      case "number":
        return typeof value === "number" && Number.isFinite(value);
      case "object":
        return value !== null && typeof value === "object" && !Array.isArray(value);
      case "string":
        return typeof value === "string";
      default:
        return true;
    }
  });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function normalizeRoot(rootInput) {
  return path.resolve(rootInput || process.cwd());
}

function normalizeStateRoot(root, input) {
  const full = path.isAbsolute(input) ? path.resolve(input) : resolveInside(root, input);
  return normalizeRel(path.relative(root, full));
}

function resolveInside(root, relativePath) {
  if (path.isAbsolute(relativePath)) {
    const full = path.resolve(relativePath);
    assertInside(root, full);
    return full;
  }
  const full = path.resolve(root, relativePath);
  assertInside(root, full);
  return full;
}

function assertInside(root, fullPath) {
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, fullPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new CliError(`Path escapes workspace root: ${fullPath}`, 2);
  }
}

function normalizeRel(value) {
  return toPosix(path.normalize(value || ""));
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function addError(result, code, message, filePath) {
  result.errors.push({ code, message, path: toPosix(filePath) });
  result.ok = false;
}

function addWarning(result, code, message, filePath) {
  result.warnings.push({ code, message, path: toPosix(filePath) });
}

function requireArg(value, label) {
  if (!value) throw new CliError(`Missing ${label}.`, 2);
  return value;
}

function assertTaskKey(taskKey) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(taskKey)) {
    throw new CliError("Task key may contain only letters, digits, dots, underscores, and hyphens.", 2);
  }
}

function printJsonOrText(args, json, text) {
  if (args.json) console.log(JSON.stringify(json, null, 2));
  else console.log(text);
}

function printHelp() {
  console.log(`ACH CLI

Usage:
  ach init <task-key> [--root <workspace>] [--dry-run] [--no-bind]
  ach bind <task-key> <state-root> [--root <workspace>] [--dry-run]
  ach validate [workspace] [--task <task-key>] [--json]
  ach checkpoint <task-key> --file <state-file> --append <text>
  ach handoff <task-key> [--json]
  ach preflight <task-key> [--json]
  ach resume <task-key> [--json]

State files:
  current-goal, confirmed-constraints, pending-items, decisions
`);
}

class CliError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

process.exitCode = main();
