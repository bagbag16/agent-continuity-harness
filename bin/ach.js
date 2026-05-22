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

const KNOWN_SUPPLEMENTAL_ROLES = new Set([
  "active-context",
  "branch-attempt-ledger",
  "artifact-provenance-index",
  "state-relation-index",
  "compiled-lineage",
]);

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  try {
    switch (command) {
      case "init":
        return cmdInit(args);
      case "bind":
        return cmdBind(args);
      case "list":
      case "tasks":
        return cmdList(args);
      case "health":
        return cmdHealth(args);
      case "validate":
        return cmdValidate(args);
      case "checkpoint":
        return cmdCheckpoint(args);
      case "record":
        return cmdRecord(args);
      case "handoff":
        return cmdHandoff(args);
      case "pause":
        return cmdPause(args);
      case "preflight":
      case "resume":
        return cmdPreflight(args, command);
      case "status":
        return cmdStatus(args);
      case "check-write":
        return cmdCheckWrite(args);
      case "add-supplemental":
        return cmdAddSupplemental(args);
      case "artifact":
        return cmdArtifact(args);
      case "repair":
        return cmdRepair(args);
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
    if ([
      "--json",
      "--dry-run",
      "--no-bind",
      "--compact",
      "--full",
      "--default-read",
      "--blocking",
      "--blocks-recovery-if-missing",
      "--no-validator",
      "--brief",
      "--safe",
    ].includes(flag)) {
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
        validators: [],
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
  if (args.compact && args.full) {
    throw new CliError("Use either --compact or --full, not both.", 2);
  }

  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const payload = buildHandoffPayload(root, taskKey, args);
  if (!payload) {
    const result = validateWorkspace(root, taskKey);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printValidation(result);
    return 1;
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(args.full ? renderHandoff(payload) : renderCompactHandoff(payload));
  }
  return 0;
}

function buildHandoffPayload(root, taskKey, args = {}) {
  const result = validateWorkspace(root, taskKey);
  if (!result.ok) {
    return null;
  }

  const binding = getBinding(root, taskKey);
  const stateRoot = resolveInside(root, binding.formal_state_root);
  const manifest = manifestFromStateRoot(stateRoot);
  return {
    task_key: taskKey,
    formal_state_root: binding.formal_state_root,
    source: "ACH formal state root",
    generated_at: new Date().toISOString(),
    current_goal: readFile(path.join(stateRoot, "current-goal.md")),
    confirmed_constraints: readFile(path.join(stateRoot, "confirmed-constraints.md")),
    pending_items: readFile(path.join(stateRoot, "pending-items.md")),
    decisions: readFile(path.join(stateRoot, "decisions.md")),
    supplemental_documents: readSupplementalDocumentsForHandoff(stateRoot, manifest),
  };
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

function cmdList(args) {
  const root = normalizeRoot(args.root || args._[0]);
  const payload = buildListPayload(root);
  if (payload.errors && payload.errors.length > 0) {
    if (args.json) console.log(JSON.stringify(payload, null, 2));
    else console.log("No ACH tasks are bound in this workspace.");
    return 1;
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.tasks.length === 0) {
    console.log("No ACH tasks are bound in this workspace.");
  } else {
    for (const task of payload.tasks) {
      const state = task.valid ? "valid" : "invalid";
      console.log(`${task.task_key}: ${state}; root=${task.formal_state_root}; mode=${task.active_mode || "unknown"}; warnings=${task.warnings}`);
    }
  }
  return 0;
}

function cmdHealth(args) {
  const root = normalizeRoot(args.root || args._[0]);
  const payload = buildListPayload(root);
  payload.ok = !payload.errors && payload.tasks.every((task) => task.valid);

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.ok) {
    console.log(`ACH workspace is healthy. Checked ${payload.tasks.length} task(s).`);
  } else {
    console.log("ACH workspace has health issues.");
    if (payload.errors) {
      for (const error of payload.errors) console.log(`ERROR ${error.code}: ${error.message} (${error.path})`);
    }
    for (const task of payload.tasks || []) {
      if (!task.valid) console.log(`INVALID ${task.task_key}: errors=${task.errors}; warnings=${task.warnings}; root=${task.formal_state_root}`);
    }
  }
  return payload.ok ? 0 : 1;
}

function buildListPayload(root) {
  const bindingsPath = path.join(root, ".cca-bindings.json");
  if (!fs.existsSync(bindingsPath)) {
    return { root, tasks: [], errors: [{ code: "ACH_BINDINGS_MISSING", message: ".cca-bindings.json is missing.", path: ".cca-bindings.json" }] };
  }

  const bindings = JSON.parse(fs.readFileSync(bindingsPath, "utf8"));
  const tasks = Object.entries(bindings.bindings || {}).map(([taskKey, binding]) => {
    const taskValidation = validateWorkspace(root, taskKey);
    const stateRootRel = binding && binding.formal_state_root ? binding.formal_state_root : "";
    let manifest = null;
    try {
      const stateRoot = stateRootRel ? resolveInside(root, stateRootRel) : "";
      manifest = stateRoot && fs.existsSync(path.join(stateRoot, "state-manifest.json")) ? manifestFromStateRoot(stateRoot) : null;
    } catch (error) {
      manifest = null;
    }
    return {
      task_key: taskKey,
      formal_state_root: stateRootRel,
      valid: taskValidation.ok,
      errors: taskValidation.errors.length,
      warnings: taskValidation.warnings.length,
      active_mode: manifest ? manifest.active_mode : null,
      integrity_status: manifest ? manifest.integrity_status : null,
      supplemental_documents: manifest && Array.isArray(manifest.supplemental_documents) ? manifest.supplemental_documents.length : 0,
      validators: manifest && Array.isArray(manifest.validators) ? manifest.validators.length : 0,
    };
  });

  return { root, tasks };
}

function cmdStatus(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const payload = buildStatusPayload(root, taskKey);

  if (args.json) {
    if (args.brief) payload.brief = renderStatusBrief(payload);
    console.log(JSON.stringify(payload, null, 2));
  } else if (args.brief) {
    console.log(renderStatusBrief(payload));
  } else {
    console.log(renderStatus(payload));
  }
  return payload.ready ? 0 : 1;
}

function cmdRecord(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const type = requireArg(args.type, "record type");
  const text = requireArg(args.text || args.message || args.content || args.append, "record text");
  const root = normalizeRoot(args.root);
  const binding = getBinding(root, taskKey);
  const stateRoot = resolveInside(root, binding.formal_state_root);
  const entry = buildRecordEntry(type, text, args);
  const targetFile = recordTargetFile(type);
  const target = path.join(stateRoot, targetFile);

  if (args.dry_run) {
    printJsonOrText(args, { action: "record", task_key: taskKey, type, file: targetFile, entry }, `Would append ${type} record to ${targetFile}.`);
    return 0;
  }

  fs.appendFileSync(target, entry, "utf8");
  printJsonOrText(args, { action: "record", task_key: taskKey, type, file: targetFile, entry }, `Recorded ${type} in ${targetFile}.`);
  return 0;
}

function cmdPause(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const status = buildStatusPayload(root, taskKey);
  const checkWrite = buildCheckWritePayload(root, taskKey);
  const handoff = buildHandoffPayload(root, taskKey);
  const payload = {
    task_key: taskKey,
    ready: status.ready && checkWrite.ok,
    status,
    check_write: checkWrite,
    handoff: handoff ? renderCompactHandoff(handoff) : null,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`# ACH Pause: ${taskKey}`);
    console.log("");
    console.log(renderStatusBrief(status));
    console.log("");
    renderCheckWrite(checkWrite);
    if (payload.handoff) {
      console.log("");
      console.log(payload.handoff);
    }
  }
  return payload.ready ? 0 : 1;
}

function cmdCheckWrite(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const payload = buildCheckWritePayload(root, taskKey);

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    renderCheckWrite(payload);
  }
  return payload.ok ? 0 : 1;
}

function cmdAddSupplemental(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  const role = requireArg(args.role, "supplemental role");
  if (!KNOWN_SUPPLEMENTAL_ROLES.has(role)) {
    throw new CliError(`Unknown supplemental role: ${role}`, 2);
  }

  const root = normalizeRoot(args.root);
  const context = getTaskContext(root, taskKey);
  const defaultPath = defaultSupplementalPath(role);
  const manifest = context.manifest;
  const requestedPath = normalizeStateRelativePath(args.path || defaultPath);
  const existingByRole = (manifest.supplemental_documents || []).find((document) => document.role === role);
  const documentPath = existingByRole ? normalizeStateRelativePath(existingByRole.path) : requestedPath;
  const existing = (manifest.supplemental_documents || []).find((document) => normalizeRel(document.path) === documentPath || document.role === role);
  const entry = existing || {
    id: args.id || nextSupplementalId(manifest),
    path: documentPath,
    role,
    status: args.status || "active",
    default_read: Boolean(args.default_read || role === "active-context"),
    read_when: args.read_when || defaultReadWhen(role),
    blocks_recovery_if_missing: Boolean(args.blocking || args.blocks_recovery_if_missing || role === "active-context"),
  };

  const target = resolveInside(context.stateRoot, documentPath);
  const relativeToState = path.relative(context.stateRoot, target);
  if (relativeToState.startsWith("..") || path.isAbsolute(relativeToState)) {
    throw new CliError(`Supplemental path escapes state root: ${documentPath}`, 2);
  }

  const changes = [];
  if (!existing) changes.push(`register ${documentPath} as ${role}`);
  if (!fs.existsSync(target)) changes.push(`create ${documentPath}`);

  if (role === "artifact-provenance-index" && !args.no_validator && !hasArtifactIndexValidator(manifest, documentPath)) {
    changes.push(`register artifact-index validator for ${documentPath}`);
  }

  if (args.dry_run) {
    printJsonOrText(args, { action: "add-supplemental", task_key: taskKey, entry, changes }, `Would ${changes.join("; ") || "make no changes"}.`);
    return 0;
  }

  if (!existing) {
    manifest.supplemental_documents = manifest.supplemental_documents || [];
    manifest.supplemental_documents.push(entry);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, supplementalTemplate(role), "utf8");
  }
  if (role === "artifact-provenance-index" && !args.no_validator) {
    ensureArtifactIndexValidator(manifest, documentPath);
  }
  writeManifest(context.stateRoot, manifest);

  printJsonOrText(args, { action: "add-supplemental", task_key: taskKey, entry, changes }, `Updated supplemental role ${role} for ${taskKey}.`);
  return 0;
}

function cmdArtifact(args) {
  const subcommand = requireArg(args._[0], "artifact subcommand");
  if (subcommand === "check") return cmdArtifactCheck(args);
  if (subcommand === "add") return cmdArtifactAdd(args);
  throw new CliError("artifact subcommand must be one of: check, add", 2);
}

function cmdArtifactCheck(args) {
  const taskKey = requireArg(args._[1] || args.task, "task key");
  const root = normalizeRoot(args.root);
  const payload = buildArtifactCheckPayload(root, taskKey);
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (payload.ok) {
    console.log(`Artifact index is valid for ${taskKey}. Checked ${payload.artifacts.length} artifact(s).`);
  } else {
    console.log(`Artifact index has ${payload.issues.length} issue(s) for ${taskKey}.`);
    for (const issue of payload.issues) console.log(`- ${issue}`);
  }
  return payload.ok ? 0 : 1;
}

function cmdArtifactAdd(args) {
  const taskKey = requireArg(args._[1] || args.task, "task key");
  const artifactPath = requireArg(args.path, "artifact path");
  const root = normalizeRoot(args.root);
  const context = getTaskContext(root, taskKey);
  const manifest = context.manifest;
  const indexPath = ensureArtifactIndexSupplemental(manifest);
  const indexTarget = path.join(context.stateRoot, indexPath);
  fs.mkdirSync(path.dirname(indexTarget), { recursive: true });
  if (!fs.existsSync(indexTarget)) fs.writeFileSync(indexTarget, supplementalTemplate("artifact-provenance-index"), "utf8");

  const parsed = parseArtifactIndex(readFile(indexTarget));
  const id = args.id || nextArtifactId(parsed.artifacts);
  const normalizedArtifactPath = normalizeRel(artifactPath);
  if (parsed.artifacts.some((artifact) => artifact.id === id)) throw new CliError(`Artifact id already exists: ${id}`, 1);
  if (parsed.artifacts.some((artifact) => artifact.path === normalizedArtifactPath)) throw new CliError(`Artifact path already exists: ${normalizedArtifactPath}`, 1);

  const entry = {
    id,
    path: normalizedArtifactPath,
    kind: args.kind || "artifact",
    produced_by: args.produced_by || "manual",
    mouth: args.mouth || "current",
    status: args.status || "active",
    valid_when: args.valid_when || "",
    invalid_when: args.invalid_when || "",
    replacement: args.replacement || "",
    depends_on: splitList(args.depends_on),
    source_paths: splitList(args.source_paths),
  };

  if (args.dry_run) {
    printJsonOrText(args, { action: "artifact add", task_key: taskKey, artifact: entry, index: indexPath }, `Would add artifact ${id} to ${indexPath}.`);
    return 0;
  }

  fs.appendFileSync(indexTarget, renderArtifactEntry(entry), "utf8");
  ensureArtifactIndexValidator(manifest, indexPath);
  writeManifest(context.stateRoot, manifest);

  printJsonOrText(args, { action: "artifact add", task_key: taskKey, artifact: entry, index: indexPath }, `Added artifact ${id} to ${indexPath}.`);
  return 0;
}

function cmdRepair(args) {
  const taskKey = requireArg(args._[0] || args.task, "task key");
  if (!args.safe) throw new CliError("repair requires --safe for now.", 2);

  const root = normalizeRoot(args.root);
  const context = getTaskContext(root, taskKey);
  const manifest = context.manifest;
  const supplemental = manifest.supplemental_documents || [];
  const changes = [];

  let activeContext = supplemental.find((document) => document.role === "active-context" && (document.status || "active") === "active");
  if (supplemental.length > 1 && !activeContext) {
    activeContext = {
      id: nextSupplementalId(manifest),
      path: "active-context.md",
      role: "active-context",
      status: "active",
      default_read: true,
      read_when: defaultReadWhen("active-context"),
      blocks_recovery_if_missing: true,
    };
    manifest.supplemental_documents = supplemental;
    manifest.supplemental_documents.push(activeContext);
    changes.push("registered active-context.md");
  }

  if (activeContext && !activeContext.default_read) {
    activeContext.default_read = true;
    changes.push("set active-context default_read=true");
  }
  if (activeContext && !activeContext.blocks_recovery_if_missing) {
    activeContext.blocks_recovery_if_missing = true;
    changes.push("set active-context blocks_recovery_if_missing=true");
  }
  if (activeContext) {
    const activeTarget = path.resolve(context.stateRoot, activeContext.path);
    const relativeToState = path.relative(context.stateRoot, activeTarget);
    if (!relativeToState.startsWith("..") && !path.isAbsolute(relativeToState) && !fs.existsSync(activeTarget)) {
      changes.push(`created ${activeContext.path}`);
      if (!args.dry_run) {
        fs.mkdirSync(path.dirname(activeTarget), { recursive: true });
        fs.writeFileSync(activeTarget, supplementalTemplate("active-context"), "utf8");
      }
    }
  }

  for (const document of manifest.supplemental_documents || []) {
    if (document.role === "artifact-provenance-index" && !hasArtifactIndexValidator(manifest, document.path)) {
      changes.push(`registered artifact-index validator for ${document.path}`);
      if (!args.dry_run) ensureArtifactIndexValidator(manifest, document.path);
    }
  }

  for (const validator of manifest.validators || []) {
    if (validator.type === "artifact-index" && activeContext && !validator.active_context) {
      validator.active_context = activeContext.path;
      changes.push(`set ${validator.id || validator.target} active_context=${activeContext.path}`);
    }
  }

  if (args.dry_run) {
    printJsonOrText(args, { action: "repair", task_key: taskKey, mode: "safe", changes }, `Would apply ${changes.length} safe repair(s).`);
    return 0;
  }

  if (changes.length > 0) writeManifest(context.stateRoot, manifest);
  printJsonOrText(args, { action: "repair", task_key: taskKey, mode: "safe", changes }, `Applied ${changes.length} safe repair(s).`);
  return 0;
}

function buildStatusPayload(root, taskKey) {
  const validation = validateWorkspace(root, taskKey);
  const binding = validation.ok ? getBinding(root, taskKey) : safeGetBinding(root, taskKey);
  const payload = {
    task_key: taskKey,
    ready: validation.ok,
    formal_state_root: binding ? binding.formal_state_root : null,
    validation: {
      errors: validation.errors,
      warnings: validation.warnings,
    },
    current_route: "",
    active_rules: "",
    active_artifacts: [],
    current_blockers: "",
    read_next: "",
    recovery_core: null,
    supplemental_documents: [],
  };

  if (!binding) return payload;

  const stateRoot = resolveInside(root, binding.formal_state_root);
  const manifest = manifestFromStateRoot(stateRoot);
  payload.supplemental_documents = manifest && Array.isArray(manifest.supplemental_documents)
    ? manifest.supplemental_documents.map((document) => ({
        id: document.id || null,
        path: document.path,
        role: document.role,
        status: document.status || "active",
        default_read: Boolean(document.default_read),
        read_when: document.read_when || "",
      }))
    : [];

  const activePath = findSupplementalPathForRole(manifest, "active-context");
  if (activePath) {
    const activeTarget = path.resolve(stateRoot, activePath);
    if (fs.existsSync(activeTarget)) {
      const activeText = readFile(activeTarget);
      const parsed = parseActiveContext(activeText);
      payload.current_route = parsed.route;
      payload.active_artifacts = parsed.artifacts;
      payload.active_rules = pickFirstMarkdownSectionContent(activeText, ["Active Rules", "Active Constraints", "当前有效规则", "当前有效约束"]);
      payload.current_blockers = pickFirstMarkdownSectionContent(activeText, ["Current Blockers", "Blockers", "当前阻塞点"]);
      payload.read_next = pickFirstMarkdownSectionContent(activeText, ["Read Next", "Read Order", "下一步读取"]);
    }
  }

  payload.recovery_core = {
    current_goal: compactMarkdown(readOptionalFile(path.join(stateRoot, "current-goal.md")), 20),
    confirmed_constraints: compactMarkdown(readOptionalFile(path.join(stateRoot, "confirmed-constraints.md")), 20),
    pending_items: compactMarkdown(readOptionalFile(path.join(stateRoot, "pending-items.md")), 20),
    decisions: compactMarkdown(readOptionalFile(path.join(stateRoot, "decisions.md")), 20),
  };

  return payload;
}

function renderStatus(payload) {
  if (!payload.ready) {
    return [
      `ACH status for ${payload.task_key}: not ready`,
      ...payload.validation.errors.map((error) => `ERROR ${error.code}: ${error.message} (${error.path})`),
      ...payload.validation.warnings.map((warning) => `WARN ${warning.code}: ${warning.message} (${warning.path})`),
    ].join("\n");
  }

  const lines = [
    `ACH status for ${payload.task_key}: ready`,
    `State root: ${payload.formal_state_root}`,
  ];
  if (payload.current_route) lines.push(`Current route: ${payload.current_route}`);
  if (payload.current_blockers) lines.push(`Current blockers:\n${payload.current_blockers}`);
  if (payload.read_next) lines.push(`Read next:\n${payload.read_next}`);
  if (payload.active_artifacts.length > 0) lines.push(`Active artifacts: ${payload.active_artifacts.join(", ")}`);
  if (payload.validation.warnings.length > 0) lines.push(`Warnings: ${payload.validation.warnings.length}`);
  return lines.join("\n");
}

function renderStatusBrief(payload) {
  if (!payload.ready) {
    const firstError = payload.validation.errors[0];
    return firstError
      ? `ACH ${payload.task_key}: not ready; ${firstError.code}: ${firstError.message}`
      : `ACH ${payload.task_key}: not ready`;
  }

  const parts = [`ACH ${payload.task_key}: ready`];
  if (payload.current_route) parts.push(`route=${payload.current_route}`);
  if (payload.current_blockers) parts.push(`blockers=${singleLine(payload.current_blockers, 96)}`);
  if (payload.read_next) parts.push(`read_next=${singleLine(payload.read_next, 96)}`);
  if (payload.active_artifacts.length > 0) parts.push(`artifacts=${payload.active_artifacts.length}`);
  if (payload.validation.warnings.length > 0) parts.push(`warnings=${payload.validation.warnings.length}`);
  return parts.join("; ");
}

function singleLine(value, maxLength = 160) {
  const text = String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(" ");
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function recordTargetFile(type) {
  const normalized = String(type || "").toLowerCase();
  const map = {
    decision: "decisions.md",
    decisions: "decisions.md",
    constraint: "confirmed-constraints.md",
    constraints: "confirmed-constraints.md",
    pending: "pending-items.md",
    todo: "pending-items.md",
    goal: "current-goal.md",
    status: "current-goal.md",
  };
  const file = map[normalized];
  if (!file) throw new CliError("--type must be one of: decision, constraint, pending, goal", 2);
  return file;
}

function buildRecordEntry(type, text, args) {
  const normalized = String(type || "").toLowerCase();
  const timestamp = new Date().toISOString();
  const id = args.id || `${recordIdPrefix(normalized)}-${timestamp.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  if (["decision", "decisions"].includes(normalized)) {
    return `

- id: ${id}
  decision: "${escapeYamlString(text)}"
  change-type: ${args.change_type || "add"}
  affects: "${escapeYamlString(args.affects || "Task continuity")}"
  basis: "${escapeYamlString(args.basis || "Recorded through ach record.")}"
`;
  }
  if (["constraint", "constraints"].includes(normalized)) {
    return `

- id: ${id}
  statement: "${escapeYamlString(text)}"
  scope: "${escapeYamlString(args.scope || "Current task")}"
  basis: "${escapeYamlString(args.basis || "Recorded through ach record.")}"
`;
  }
  if (["pending", "todo"].includes(normalized)) {
    return `

## Item

- id: ${id}
  content: "${escapeYamlString(text)}"
  impact: "${escapeYamlString(args.impact || "Task continuation")}"
  blocking: ${args.blocking || "no"}
  continue-by: "${escapeYamlString(args.continue_by || "Review this item before continuing if it becomes relevant.")}"
  basis: "${escapeYamlString(args.basis || "Recorded through ach record.")}"
`;
  }
  return `

## Record ${timestamp}

- ${text}
`;
}

function recordIdPrefix(type) {
  if (type.startsWith("decision")) return "D";
  if (type.startsWith("constraint")) return "C";
  if (type.startsWith("pending") || type === "todo") return "P";
  return "R";
}

function escapeYamlString(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildCheckWritePayload(root, taskKey) {
  const validation = validateWorkspace(root, taskKey);
  const payload = {
    task_key: taskKey,
    ok: validation.ok,
    validation,
    closure_errors: [],
    closure_warnings: [],
  };

  const binding = validation.ok ? getBinding(root, taskKey) : safeGetBinding(root, taskKey);
  if (!binding) return payload;

  const stateRoot = resolveInside(root, binding.formal_state_root);
  const manifest = manifestFromStateRoot(stateRoot);
  const supplemental = manifest && Array.isArray(manifest.supplemental_documents) ? manifest.supplemental_documents : [];
  const activeContext = supplemental.find((document) => document.role === "active-context" && (document.status || "active") === "active");
  const artifactIndex = supplemental.find((document) => document.role === "artifact-provenance-index" && (document.status || "active") === "active");

  if (supplemental.length > 1 && !activeContext) {
    payload.closure_warnings.push("Multiple supplemental documents exist but no active-context switchboard is registered.");
  }
  if (activeContext && !activeContext.default_read) {
    payload.closure_errors.push("active-context is active but not default_read, so compact recovery may miss current state.");
  }
  if (artifactIndex && !hasArtifactIndexValidator(manifest, artifactIndex.path)) {
    payload.closure_warnings.push(`artifact-provenance-index ${artifactIndex.path} has no artifact-index validator.`);
  }

  if (activeContext && artifactIndex) {
    const activeTarget = path.resolve(stateRoot, activeContext.path);
    const artifactTarget = path.resolve(stateRoot, artifactIndex.path);
    if (fs.existsSync(activeTarget) && fs.existsSync(artifactTarget)) {
      const active = parseActiveContext(readFile(activeTarget));
      const artifacts = parseArtifactIndex(readFile(artifactTarget)).artifacts;
      const artifactIssues = validateArtifactIndexAgainstActiveContext(artifacts, active);
      payload.closure_errors.push(...artifactIssues);
    }
  }

  payload.ok = validation.ok && payload.closure_errors.length === 0;
  return payload;
}

function renderCheckWrite(payload) {
  if (payload.ok) console.log(`ACH write closure is valid for ${payload.task_key}.`);
  else console.log(`ACH write closure has issues for ${payload.task_key}.`);
  for (const error of payload.validation.errors) console.log(`ERROR ${error.code}: ${error.message} (${error.path})`);
  for (const warning of payload.validation.warnings) console.log(`WARN ${warning.code}: ${warning.message} (${warning.path})`);
  for (const issue of payload.closure_errors) console.log(`ERROR ACH_WRITE_CLOSURE: ${issue}`);
  for (const issue of payload.closure_warnings) console.log(`WARN ACH_WRITE_CLOSURE: ${issue}`);
}

function buildArtifactCheckPayload(root, taskKey) {
  const context = getTaskContext(root, taskKey);
  const manifest = context.manifest;
  const artifactIndexPath = findSupplementalPathForRole(manifest, "artifact-provenance-index");
  const payload = {
    task_key: taskKey,
    ok: true,
    artifact_index: artifactIndexPath,
    artifacts: [],
    issues: [],
  };

  if (!artifactIndexPath) {
    payload.ok = false;
    payload.issues.push("No artifact-provenance-index supplemental document is registered.");
    return payload;
  }

  const artifactTarget = path.resolve(context.stateRoot, artifactIndexPath);
  if (!fs.existsSync(artifactTarget) || !fs.statSync(artifactTarget).isFile()) {
    payload.ok = false;
    payload.issues.push(`Artifact index is missing: ${artifactIndexPath}`);
    return payload;
  }

  const parsed = parseArtifactIndex(readFile(artifactTarget));
  payload.artifacts = parsed.artifacts;
  payload.issues.push(...parsed.issues, ...validateArtifactIndexStructure(parsed.artifacts), ...validateArtifactSourcePaths(root, parsed.artifacts));

  const activeContextPath = findSupplementalPathForRole(manifest, "active-context");
  if (activeContextPath) {
    const activeTarget = path.resolve(context.stateRoot, activeContextPath);
    if (fs.existsSync(activeTarget)) {
      payload.issues.push(...validateArtifactIndexAgainstActiveContext(parsed.artifacts, parseActiveContext(readFile(activeTarget))));
    }
  }

  payload.ok = payload.issues.length === 0;
  return payload;
}

function getTaskContext(root, taskKey) {
  const binding = getBinding(root, taskKey);
  const stateRoot = resolveInside(root, binding.formal_state_root);
  const manifest = manifestFromStateRoot(stateRoot);
  if (!manifest) throw new CliError(`Missing state-manifest.json for ${taskKey}`, 1);
  return { binding, stateRoot, manifest };
}

function safeGetBinding(root, taskKey) {
  try {
    return getBinding(root, taskKey);
  } catch (error) {
    return null;
  }
}

function defaultSupplementalPath(role) {
  const map = {
    "active-context": "active-context.md",
    "branch-attempt-ledger": "branch-attempt-ledger.md",
    "artifact-provenance-index": "artifact-provenance-index.md",
    "state-relation-index": "state-relation-index.md",
    "compiled-lineage": "compiled-lineage.md",
  };
  return map[role] || `${role}.md`;
}

function defaultReadWhen(role) {
  const map = {
    "active-context": "Read before resuming a complex multi-branch task.",
    "branch-attempt-ledger": "Read when branch history, discarded routes, or route portability matters.",
    "artifact-provenance-index": "Read when checking reusable artifact validity or provenance.",
    "state-relation-index": "Read when dependencies, conflicts, supersession, or correction impact matters.",
    "compiled-lineage": "Read when explaining why the current route exists.",
  };
  return map[role] || "Read when this supplemental role is relevant.";
}

function supplementalTemplate(role) {
  if (role === "active-context") {
    return `# active-context

## Current Route

- active_route:

## Active Rules

- none

## Active Artifacts

- none

## Current Blockers

- none

## Read Next

- current-goal.md
`;
  }
  if (role === "artifact-provenance-index") {
    return `# artifact-provenance-index

## Artifacts
`;
  }
  if (role === "branch-attempt-ledger") {
    return `# branch-attempt-ledger

## Branch Attempts
`;
  }
  if (role === "state-relation-index") {
    return `# state-relation-index

## Relations
`;
  }
  if (role === "compiled-lineage") {
    return `# compiled-lineage

## Lineage
`;
  }
  return `# ${role}
`;
}

function normalizeStateRelativePath(value) {
  const normalized = normalizeRel(value);
  if (!normalized || normalized.startsWith("../") || path.isAbsolute(normalized)) {
    throw new CliError(`Invalid state-relative path: ${value}`, 2);
  }
  return normalized;
}

function nextSupplementalId(manifest) {
  const used = new Set((manifest.supplemental_documents || []).map((document) => document.id).filter(Boolean));
  let index = 1;
  while (used.has(`S${index}`)) index += 1;
  return `S${index}`;
}

function hasArtifactIndexValidator(manifest, targetPath) {
  return Boolean((manifest.validators || []).find((validator) => validator.type === "artifact-index" && normalizeRel(validator.target) === normalizeRel(targetPath)));
}

function ensureArtifactIndexValidator(manifest, targetPath) {
  manifest.validators = manifest.validators || [];
  if (hasArtifactIndexValidator(manifest, targetPath)) return;
  const validator = {
    id: nextValidatorId(manifest),
    type: "artifact-index",
    target: targetPath,
    status: "active",
    blocks_recovery_if_failed: false,
  };
  const activeContextPath = findSupplementalPathForRole(manifest, "active-context");
  if (activeContextPath) validator.active_context = activeContextPath;
  manifest.validators.push(validator);
}

function nextValidatorId(manifest) {
  const used = new Set((manifest.validators || []).map((validator) => validator.id).filter(Boolean));
  let index = 1;
  while (used.has(`V${index}`)) index += 1;
  return `V${index}`;
}

function ensureArtifactIndexSupplemental(manifest) {
  manifest.supplemental_documents = manifest.supplemental_documents || [];
  const existing = manifest.supplemental_documents.find((document) => document.role === "artifact-provenance-index");
  if (existing) return existing.path;

  const documentPath = "artifact-provenance-index.md";
  manifest.supplemental_documents.push({
    id: nextSupplementalId(manifest),
    path: documentPath,
    role: "artifact-provenance-index",
    status: "active",
    default_read: false,
    read_when: defaultReadWhen("artifact-provenance-index"),
    blocks_recovery_if_missing: false,
  });
  return documentPath;
}

function nextArtifactId(artifacts) {
  const used = new Set((artifacts || []).map((artifact) => artifact.id));
  let index = 1;
  while (used.has(`A-${String(index).padStart(3, "0")}`)) index += 1;
  return `A-${String(index).padStart(3, "0")}`;
}

function splitList(value) {
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function renderArtifactEntry(artifact) {
  const dependsOn = artifact.depends_on.length === 0 ? "" : `\n  - ${artifact.depends_on.join("\n  - ")}`;
  const sourcePaths = artifact.source_paths.length === 0 ? "" : `\n  - ${artifact.source_paths.join("\n  - ")}`;
  return `

### ${artifact.id}

- path: \`${artifact.path}\`
- kind: ${artifact.kind}
- produced_by: ${artifact.produced_by}
- mouth: ${artifact.mouth}
- status: ${artifact.status}
- valid_when: ${artifact.valid_when}
- invalid_when: ${artifact.invalid_when}
- replacement: ${artifact.replacement}
- depends_on:${dependsOn}
- source_paths:${sourcePaths}
`;
}

function writeManifest(stateRoot, manifest) {
  fs.writeFileSync(path.join(stateRoot, "state-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function validateWorkspace(root, taskFilter) {
  const result = { ok: true, root, checked: [], errors: [], warnings: [] };
  const bindingsPath = path.join(root, ".cca-bindings.json");
  const bindings = readJsonFile(bindingsPath, result, "ACH_BINDINGS_INVALID");
  if (!bindings) {
    addError(result, "ACH_BINDINGS_MISSING", ".cca-bindings.json is missing or invalid.", ".cca-bindings.json");
    return result;
  }

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

  validateBindingsSchema(bindings, taskFilter, result);

  for (const [taskKey, binding] of entries) {
    validateBinding(root, taskKey, binding, result);
  }

  result.ok = result.errors.length === 0;
  return result;
}

function validateBindingsSchema(bindings, taskFilter, result) {
  const scopedBindings = taskFilter
    ? {
        ...bindings,
        bindings: {
          [taskFilter]: bindings.bindings[taskFilter],
        },
      }
    : bindings;

  validateSchemaFile("bindings.schema.json", scopedBindings, result, "ACH_BINDINGS_SCHEMA", ".cca-bindings.json");
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

  validateSupplementalDocuments(stateRoot, binding.formal_state_root, manifest, manifestRelPath, result);
  validateManifestValidators(root, stateRoot, binding.formal_state_root, manifest, result);

  const extraFiles = fs.readdirSync(stateRoot).filter((name) => /handoff|summary|resume/i.test(name));
  for (const file of extraFiles) {
    addWarning(result, "ACH_DERIVED_VIEW_IN_STATE_ROOT", `Derived view appears inside formal state root: ${file}`, toPosix(path.join(binding.formal_state_root, file)));
  }
}

function validateSupplementalDocuments(stateRoot, stateRootRel, manifest, manifestRelPath, result) {
  if (!Array.isArray(manifest.supplemental_documents)) return;

  for (const document of manifest.supplemental_documents) {
    if (!document || typeof document.path !== "string") continue;

    const reportPath = toPosix(path.join(stateRootRel, document.path));
    const target = path.resolve(stateRoot, document.path);
    const relativeToState = path.relative(stateRoot, target);
    if (relativeToState.startsWith("..") || path.isAbsolute(relativeToState)) {
      addError(result, "ACH_SUPPLEMENTAL_DOCUMENT_OUTSIDE_STATE_ROOT", `Supplemental document escapes formal state root: ${document.path}`, reportPath);
      continue;
    }

    if (!KNOWN_SUPPLEMENTAL_ROLES.has(document.role) && document.status !== "custom") {
      addWarning(result, "ACH_SUPPLEMENTAL_ROLE_UNKNOWN", `Supplemental document role is not known: ${document.role}`, reportPath);
    }

    if (!fs.existsSync(target)) {
      const message = `Supplemental document is missing: ${document.path}`;
      if (document.blocks_recovery_if_missing) {
        addError(result, "ACH_SUPPLEMENTAL_DOCUMENT_MISSING", message, reportPath);
      } else {
        addWarning(result, "ACH_SUPPLEMENTAL_DOCUMENT_MISSING", message, reportPath);
      }
      continue;
    }

    const stat = fs.statSync(target);
    if (!stat.isFile()) {
      addWarning(result, "ACH_SUPPLEMENTAL_DOCUMENT_NOT_FILE", `Supplemental document is not a regular file: ${document.path}`, reportPath);
      continue;
    }

    const content = readFile(target);
    if (content.trim().length === 0) {
      addWarning(result, "ACH_SUPPLEMENTAL_DOCUMENT_EMPTY", `Supplemental document is empty: ${document.path}`, reportPath);
      continue;
    }

    if (document.role === "active-context") {
      validateActiveContextDocument(content, document, reportPath, result);
    }
  }
}

function validateActiveContextDocument(content, document, reportPath, result) {
  const requiredSections = [
    { label: "current route", headings: ["当前路线", "Active Route", "Current Route"] },
    { label: "active rules or constraints", headings: ["当前有效规则", "当前有效约束", "Active Rules", "Active Constraints"] },
    { label: "active artifacts", headings: ["当前有效产物", "Active Artifacts", "Current Artifacts"] },
    { label: "current blockers", headings: ["当前阻塞点", "Current Blockers", "Blockers"] },
    { label: "read order", headings: ["下一步读取", "Read Next", "Read Order"] },
  ];

  for (const section of requiredSections) {
    const sectionContent = pickFirstMarkdownSectionContent(content, section.headings);
    if (!sectionContent || sectionContent.trim().length === 0) {
      addRecoverabilityIssue(
        result,
        Boolean(document.blocks_recovery_if_missing),
        "ACH_ACTIVE_CONTEXT_MISSING_SECTION",
        `active-context is missing required section: ${section.label}`,
        reportPath,
      );
    }
  }
}

function addRecoverabilityIssue(result, blocking, code, message, filePath) {
  if (blocking) addError(result, code, message, filePath);
  else addWarning(result, code, message, filePath);
}

function validateManifestValidators(root, stateRoot, stateRootRel, manifest, result) {
  if (!Array.isArray(manifest.validators)) return;

  for (const validator of manifest.validators) {
    if (!validator || validator.status === "disabled") continue;

    const blocking = Boolean(validator.blocks_recovery_if_failed);
    const targetPath = typeof validator.target === "string" ? validator.target : "";
    const reportPath = toPosix(path.join(stateRootRel, targetPath || "<missing-target>"));
    const target = path.resolve(stateRoot, targetPath);
    const relativeToState = path.relative(stateRoot, target);

    if (!targetPath || relativeToState.startsWith("..") || path.isAbsolute(relativeToState)) {
      addRecoverabilityIssue(
        result,
        blocking,
        "ACH_VALIDATOR_TARGET_OUTSIDE_STATE_ROOT",
        `Validator target must stay inside the formal state root: ${targetPath}`,
        reportPath,
      );
      continue;
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      addRecoverabilityIssue(
        result,
        blocking,
        "ACH_VALIDATOR_TARGET_MISSING",
        `Validator target is missing: ${targetPath}`,
        reportPath,
      );
      continue;
    }

    if (validator.type === "artifact-index") {
      validateArtifactIndex(root, stateRoot, stateRootRel, validator, target, result);
    }
  }
}

function validateArtifactIndex(root, stateRoot, stateRootRel, validator, target, result) {
  const blocking = Boolean(validator.blocks_recovery_if_failed);
  const artifactText = readFile(target);
  const parsed = parseArtifactIndex(artifactText);
  const issues = [...parsed.issues, ...validateArtifactIndexStructure(parsed.artifacts)];

  const activeContextPath = validator.active_context || findSupplementalPathForRole(manifestFromStateRoot(stateRoot), "active-context");
  if (activeContextPath) {
    const activeContextTarget = path.resolve(stateRoot, activeContextPath);
    const relativeToState = path.relative(stateRoot, activeContextTarget);
    if (relativeToState.startsWith("..") || path.isAbsolute(relativeToState) || !fs.existsSync(activeContextTarget)) {
      issues.push(`active_context is missing or outside state root: ${activeContextPath}`);
    } else {
      const activeContext = parseActiveContext(readFile(activeContextTarget));
      issues.push(...validateArtifactIndexAgainstActiveContext(parsed.artifacts, activeContext));
    }
  }

  issues.push(...validateArtifactSourcePaths(root, parsed.artifacts));

  for (const issue of issues) {
    addRecoverabilityIssue(
      result,
      blocking,
      "ACH_ARTIFACT_INDEX_INVALID",
      issue,
      toPosix(path.join(stateRootRel, validator.target)),
    );
  }
}

function findSupplementalPathForRole(manifest, role) {
  if (!manifest || !Array.isArray(manifest.supplemental_documents)) return null;
  const match = manifest.supplemental_documents.find((document) => document.role === role && document.path);
  return match ? match.path : null;
}

function parseArtifactIndex(text) {
  const artifacts = [];
  const issues = [];
  let current = null;
  let listField = null;

  const lines = (text || "").split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const heading = line.match(/^###\s+(\S+)\s*$/);
    if (heading) {
      if (current && !current.path) {
        issues.push(`line ${current.line}: artifact ${current.id} is missing path`);
      }
      current = {
        id: heading[1],
        line: lineNumber,
        path: null,
        kind: "",
        produced_by: "",
        mouth: "",
        status: "",
        replacement: "",
        depends_on: [],
        source_paths: [],
      };
      artifacts.push(current);
      listField = null;
      return;
    }

    if (!current) {
      if (/^-\s+\w+:/.test(line)) {
        issues.push(`line ${lineNumber}: field appears before artifact heading`);
      }
      return;
    }

    const field = line.match(/^-\s+([a-zA-Z_]+):\s*(.*?)\s*$/);
    if (field) {
      const key = field[1];
      const value = field[2];
      if (["depends_on", "source_paths"].includes(key) && value === "") {
        listField = key;
        return;
      }
      if (key === "path") {
        if (current.path) issues.push(`line ${lineNumber}: artifact ${current.id} has duplicate path`);
        current.path = stripTicks(value);
      } else if (["kind", "produced_by", "mouth", "status", "replacement"].includes(key)) {
        current[key] = stripTicks(value);
      }
      listField = null;
      return;
    }

    if (listField) {
      const item = line.match(/^\s+-\s+(.+?)\s*$/);
      if (item) {
        current[listField].push(stripTicks(item[1]));
        return;
      }
      if (line.startsWith("- ") || line.trim() === "") listField = null;
    }
  });

  if (current && !current.path) {
    issues.push(`line ${current.line}: artifact ${current.id} is missing path`);
  }

  return { artifacts, issues };
}

function stripTicks(value) {
  return String(value || "").trim().replace(/^`|`$/g, "").trim();
}

function validateArtifactIndexStructure(artifacts) {
  const issues = [];
  const seenIds = new Map();
  const seenPaths = new Map();
  const seenIdPrefixes = new Set();

  for (const artifact of artifacts) {
    if (seenIds.has(artifact.id)) {
      issues.push(`line ${artifact.line}: duplicate artifact id ${artifact.id}; first seen on line ${seenIds.get(artifact.id)}`);
    } else {
      seenIds.set(artifact.id, artifact.line);
      const prefix = artifactIdPrefix(artifact.id);
      if (prefix) seenIdPrefixes.add(prefix);
    }

    if (artifact.path) {
      if (seenPaths.has(artifact.path)) {
        issues.push(`line ${artifact.line}: duplicate artifact path ${artifact.path}; first used by ${seenPaths.get(artifact.path)}`);
      } else {
        seenPaths.set(artifact.path, artifact.id);
      }
    }
  }

  for (const artifact of artifacts) {
    for (const dependency of artifact.depends_on || []) {
      const dependencyId = String(dependency || "").trim();
      if (!dependencyId || isPlaceholderDependency(dependencyId)) continue;
      const dependencyPrefix = artifactIdPrefix(dependencyId);
      if (dependencyPrefix && seenIdPrefixes.has(dependencyPrefix) && !seenIds.has(dependencyId)) {
        issues.push(`artifact ${artifact.id}: depends_on references unknown artifact id ${dependencyId}`);
      }
    }
  }

  return issues;
}

function isPlaceholderDependency(value) {
  return ["none", "n/a", "na", "null", "-"].includes(String(value || "").trim().toLowerCase());
}

function artifactIdPrefix(value) {
  const text = String(value || "").trim();
  if (!/\d+$/.test(text)) return "";
  const prefix = text.replace(/\d+$/, "");
  return /[A-Za-z]/.test(prefix) ? prefix : "";
}

function parseActiveContext(content) {
  const routeSection = pickFirstMarkdownSectionContent(content, ["当前路线", "Active Route", "Current Route"]);
  const artifactSection = pickFirstMarkdownSectionContent(content, ["当前有效产物", "Active Artifacts", "Current Artifacts"]);
  const routeMatch = routeSection.match(/`([^`]+)`/) || content.match(/active_route:\s*`?([^`\n]+)`?/i);

  return {
    route: routeMatch ? routeMatch[1].trim() : "",
    artifacts: [...artifactSection.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim()),
  };
}

function validateArtifactIndexAgainstActiveContext(artifacts, activeContext) {
  const issues = [];
  const byPath = new Map(artifacts.filter((artifact) => artifact.path).map((artifact) => [artifact.path, artifact]));

  for (const activePath of activeContext.artifacts || []) {
    const artifact = byPath.get(activePath);
    if (!artifact) {
      issues.push(`active-context references unindexed artifact ${activePath}`);
      continue;
    }

    if (artifact.status !== "active") {
      issues.push(`active-context artifact ${artifact.id} has non-active status ${artifact.status || "<empty>"}`);
    }
    if (artifact.replacement) {
      issues.push(`active-context artifact ${artifact.id} has replacement ${artifact.replacement}`);
    }
    if (activeContext.route && !mouthMatchesRoute(artifact.mouth, activeContext.route)) {
      issues.push(`active-context artifact ${artifact.id} mouth ${artifact.mouth || "<empty>"} does not match route ${activeContext.route}`);
    }
  }

  return issues;
}

function mouthMatchesRoute(mouth, route) {
  const normalizedMouth = String(mouth || "").toLowerCase();
  const normalizedRoute = String(route || "").toLowerCase();
  if (normalizedRoute && normalizedMouth.includes(normalizedRoute)) return true;

  const routeVersions = normalizedRoute.match(/v\d+(?:\.\d+)?/g) || [];
  if (routeVersions.some((version) => normalizedMouth.includes(version))) return true;

  return normalizedMouth.includes("current");
}

function validateArtifactSourcePaths(root, artifacts) {
  const issues = [];

  for (const artifact of artifacts) {
    if (!artifact.path || !Array.isArray(artifact.source_paths) || artifact.source_paths.length === 0) continue;

    let artifactPath;
    try {
      artifactPath = resolveArtifactWorkspacePath(root, artifact.path);
    } catch (error) {
      issues.push(`artifact ${artifact.id}: artifact path escapes workspace: ${artifact.path}`);
      continue;
    }
    if (!fs.existsSync(artifactPath)) continue;

    const artifactMtime = fs.statSync(artifactPath).mtimeMs;
    for (const sourcePathRaw of artifact.source_paths) {
      let sourcePath;
      try {
        sourcePath = resolveArtifactWorkspacePath(root, sourcePathRaw);
      } catch (error) {
        issues.push(`artifact ${artifact.id}: source_path escapes workspace: ${sourcePathRaw}`);
        continue;
      }
      if (!fs.existsSync(sourcePath)) {
        issues.push(`artifact ${artifact.id}: source_path missing ${sourcePathRaw}`);
        continue;
      }
      if (fs.statSync(sourcePath).mtimeMs > artifactMtime) {
        issues.push(`artifact ${artifact.id}: source_path ${sourcePathRaw} is newer than artifact ${artifact.path}`);
      }
    }
  }

  return issues;
}

function resolveArtifactWorkspacePath(root, rawPath) {
  const full = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(root, rawPath);
  assertInside(root, full);
  return full;
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

${renderSupplementalHandoff(payload.supplemental_documents)}
`;
}

function renderCompactHandoff(payload) {
  const activeContext = findIncludedSupplementalDocument(payload.supplemental_documents, "active-context");
  const activeContextSummary = activeContext && activeContext.content
    ? renderActiveContextSummary(activeContext.content)
    : "";

  const recoveryView = activeContextSummary
    ? `## Active Context\n\n${activeContextSummary}\n\n## Recovery Core\n\nThe four-file recovery core remains authoritative. Use --full when complete current-goal, confirmed-constraints, pending-items, and decisions content is needed.`
    : `## Current Goal

${compactMarkdown(payload.current_goal, 80)}

## Confirmed Constraints

${compactMarkdown(payload.confirmed_constraints, 120)}

## Pending Items

${compactMarkdown(payload.pending_items, 120)}

## Decisions

${compactMarkdown(payload.decisions, 80)}`;

  return `# ACH Handoff: ${payload.task_key}

Source: ${payload.formal_state_root}
Generated: ${payload.generated_at}

This handoff is derived from the ACH formal state root. Compact mode shows
active-context semantic sections when available; otherwise it falls back to
bounded recovery-core excerpts. Use --full for the full derived view.

${recoveryView}

${renderCompactSupplementalHandoff(payload.supplemental_documents, { includeDefaultReadContent: !activeContextSummary })}
`;
}

function findIncludedSupplementalDocument(documents, role) {
  if (!documents || documents.length === 0) return null;
  return documents.find((document) => document.role === role && document.included && document.content) || null;
}

function renderActiveContextSummary(markdown) {
  const sections = pickMarkdownSections(markdown, [
    "当前路线",
    "Current Route",
    "当前有效规则",
    "Active Rules",
    "Active Constraints",
    "当前有效产物",
    "Active Artifacts",
    "Current Artifacts",
    "诊断/历史内容",
    "Diagnostic History",
    "当前阻塞点",
    "Current Blockers",
    "下一步读取",
    "Read Next",
    "Read Order",
  ]);

  if (sections.length === 0) return compactMarkdown(markdown, 80);
  return sections.map((section) => `### ${section.heading}\n\n${compactMarkdown(section.content, 40)}`).join("\n\n");
}

function pickMarkdownSections(markdown, headings) {
  const wanted = new Set(headings.map((heading) => normalizeHeading(heading)));
  const sections = [];
  let current = null;

  for (const line of (markdown || "").split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      const title = heading[1].trim();
      current = wanted.has(normalizeHeading(title)) ? { heading: title, lines: [] } : null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  return sections
    .map((section) => ({ heading: section.heading, content: section.lines.join("\n").trim() }))
    .filter((section) => section.content.length > 0);
}

function pickFirstMarkdownSectionContent(markdown, headings) {
  const sections = pickMarkdownSections(markdown, headings);
  return sections.length > 0 ? sections[0].content : "";
}

function normalizeHeading(heading) {
  return String(heading).trim().toLowerCase();
}

function compactMarkdown(markdown, maxLines) {
  const trimmed = (markdown || "").trim();
  if (!trimmed) return "";

  const lines = trimmed.split(/\r?\n/);
  if (lines.length <= maxLines) return trimmed;

  const hidden = lines.length - maxLines;
  return `${lines.slice(0, maxLines).join("\n")}

... truncated ${hidden} line(s). Use --full for complete handoff.`;
}

function manifestFromStateRoot(stateRoot) {
  const manifestPath = path.join(stateRoot, "state-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function readSupplementalDocumentsForHandoff(stateRoot, manifest) {
  if (!manifest || !Array.isArray(manifest.supplemental_documents)) return [];

  return manifest.supplemental_documents.map((document) => {
    const entry = {
      id: document.id || null,
      path: document.path,
      role: document.role,
      status: document.status || "active",
      default_read: Boolean(document.default_read),
      read_when: document.read_when,
      blocks_recovery_if_missing: Boolean(document.blocks_recovery_if_missing),
      exists: false,
      included: false,
      content: null,
    };

    const target = path.resolve(stateRoot, document.path);
    const relativeToState = path.relative(stateRoot, target);
    if (relativeToState.startsWith("..") || path.isAbsolute(relativeToState)) {
      entry.error = "path escapes formal state root";
      return entry;
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return entry;

    entry.exists = true;
    if (entry.default_read) {
      entry.included = true;
      entry.content = readFile(target);
    }
    return entry;
  });
}

function renderSupplementalHandoff(documents) {
  if (!documents || documents.length === 0) {
    return `## Supplemental Documents

No supplemental documents declared.`;
  }

  const summary = documents.map((document) => {
    const id = document.id ? ` ${document.id}` : "";
    const status = document.status || "active";
    const readMode = document.default_read ? "default-read" : "conditional-read";
    const existence = document.exists ? "exists" : "missing";
    return `- ${document.path}${id}: role=${document.role}; status=${status}; ${readMode}; ${existence}; read_when=${document.read_when}`;
  }).join("\n");

  const included = documents.filter((document) => document.included && document.content !== null);
  const includedContent = included.length === 0
    ? "No default-read supplemental content included."
    : included.map((document) => `### ${document.path}\n\n${document.content.trim()}`).join("\n\n");

  return `## Supplemental Documents

${summary}

## Default-Read Supplemental Content

${includedContent}`;
}

function renderCompactSupplementalHandoff(documents, options = {}) {
  if (!documents || documents.length === 0) {
    return `## Supplemental Documents

No supplemental documents declared.`;
  }

  const includeDefaultReadContent = options.includeDefaultReadContent !== false;

  const summary = documents.map((document) => {
    const id = document.id ? ` ${document.id}` : "";
    const status = document.status || "active";
    const readMode = document.default_read ? "default-read" : "conditional-read";
    const existence = document.exists ? "exists" : "missing";
    return `- ${document.path}${id}: role=${document.role}; status=${status}; ${readMode}; ${existence}; read_when=${document.read_when}`;
  }).join("\n");

  let output = `## Supplemental Documents

${summary}`;

  if (includeDefaultReadContent) {
    const included = documents.filter((document) => document.included && document.content !== null);
    const includedContent = included.length === 0
      ? "No default-read supplemental content included."
      : included.map((document) => `### ${document.path}\n\n${compactMarkdown(document.content, 80)}`).join("\n\n");

    output += `\n\n## Default-Read Supplemental Content\n\n${includedContent}`;
  }

  return output;
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

function readOptionalFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? fs.readFileSync(filePath, "utf8") : "";
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
  ach list [workspace] [--json]
  ach tasks [workspace] [--json]
  ach health [workspace] [--json]
  ach validate [workspace] [--task <task-key>] [--json]
  ach checkpoint <task-key> --file <state-file> --append <text>
  ach record <task-key> --type <type> --text <text> [--json]
  ach handoff <task-key> [--compact] [--full] [--json]
  ach pause <task-key> [--json]
  ach preflight <task-key> [--json]
  ach resume <task-key> [--json]
  ach status <task-key> [--brief] [--json]
  ach check-write <task-key> [--json]
  ach add-supplemental <task-key> --role <role> [--json]
  ach artifact check <task-key> [--json]
  ach artifact add <task-key> --path <path> [--id <id>] [--json]
  ach repair <task-key> --safe [--dry-run] [--json]

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
