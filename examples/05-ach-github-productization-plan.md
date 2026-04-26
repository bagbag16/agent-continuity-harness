# ACH GitHub Productization Plan

This example records the current high-star GitHub plan for Agent Continuity
Harness.

ACH is already the repository identity. This plan does not rename or migrate the
project. It improves the public product surface around the existing ACH skill.

## Goal

Make ACH easier to understand, try, trust, and share as a GitHub project.

Target visitor path:

1. Understand the value in 5 seconds.
2. Try the skill in 3 minutes.
3. See concrete proof before reading internals.
4. Trust that the project is maintained.
5. Share the project without rewriting the positioning.

## Positioning

ACH is a continuity harness for long-running AI agent work.

It keeps goals, constraints, handoffs, and recovery stable when a task outgrows
one chat.

## Non-Goals

- Do not expand the core internal rules.
- Do not publish internal modes as separate products.
- Do not build a CLI, installer, website, or benchmark before the GitHub surface
  is clear.
- Do not position ACH as a replacement for `AGENTS.md`, LangGraph, OpenHands, or
  memory systems.

## Completed

- README product narrative
- Single public entry: `ach`
- Internal modes: `guard-mode` and `continuity-mode`
- Conceptual examples for drift recovery, window handoff, checkpoint, and
  non-use
- FAQ doc covering common comparisons
- State template README aligned to ACH continuity-mode
- Skill validation passing

## Plan Status

### Phase 1: Trial Path

- Add `docs/quickstart.md` with install, first-use prompt, and expected
  behavior.
- Add a copy-paste first-use prompt.
- Add expected first-run behavior.

Status: completed in [docs/quickstart.md](../docs/quickstart.md).

Acceptance: a new user can try ACH in under 3 minutes.

### Phase 2: Proof Layer

- Add a transcript-style demo.
- Show input, ACH readback, continuity decision, and result.
- Keep the demo short enough to scan.

Status: completed in [06-transcript-style-demo.md](06-transcript-style-demo.md).

Acceptance: the example proves what ACH prevents.

### Phase 3: Trust Layer

- Add `CHANGELOG.md`.
- Add `CONTRIBUTING.md`.
- Add issue templates.
- Use `CHANGELOG.md` as the first release note until an actual GitHub release
  needs separate notes.

Status: completed with root changelog/contributing files, GitHub issue
templates, and the unreleased `0.1.0` changelog entry.

Acceptance: the project feels maintained and safe to adopt.

### Phase 4: Distribution Layer

- Add launch copy.
- Add repository metadata suggestions.
- Add short objection responses for sharing.

Status: completed in [docs/distribution.md](../docs/distribution.md).

Acceptance: another person can share ACH without rewriting its value.

## Self-Check Rule

Every new artifact must improve one of four outcomes:

- understand
- try
- trust
- share

If an artifact does not improve one of those outcomes, defer it.
