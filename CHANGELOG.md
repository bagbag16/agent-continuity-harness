# Changelog

All notable project-surface changes are recorded here.

## 0.1.0 - Unreleased

Initial public ACH productization pass.

Added:

- Single public positioning for Agent Continuity Harness.
- README focused on understand, try, trust, and share.
- Quickstart with install instructions.
- CLI commands for init, bind, list/tasks, health, validate, checkpoint,
  record, status, check-write, handoff, pause, preflight/resume,
  add-supplemental, artifact check/add, and safe repair.
- Public state contract documentation.
- JSON schemas for state manifests and workspace bindings.
- Valid and invalid state-root fixtures.
- Node test coverage and GitHub Actions CI.
- CLI command and error-code docs.
- Reproducible recovery demo script and demo guide.
- Local installed-skill sync helper.
- Versioning policy and release artifact workflow.
- Lightweight integration notes for Codex, Claude Code, Cursor, and LangGraph.
- Install guide that separates Codex skill, CLI, and combined one-line installs.
- Recovery failure and recovery-with-ACH examples.
- Release check workflow and release checklist.
- FAQ doc covering common comparisons.
- Before/after examples and transcript-style demo.
- High-star GitHub project template.
- ACH GitHub productization plan example.
- Contribution and issue templates.
- README coverage for intent workflow presets, user-facing status rendering,
  state-effect routing, complex state externalization, supplemental state
  layers, artifact provenance, and write-to-use closure.

Clarified:

- ACH is already the repository identity.
- `guard-mode` and `continuity-mode` are internal modes.
- Internal continuity infrastructure should not be presented as a separate
  public product.
