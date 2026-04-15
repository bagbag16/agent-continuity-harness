# Drift Guard and Handoff Skills for Long-Running Agents

This repository contains two composable skills for stable, long-running AI collaboration:

- `agent-drift-guard`: lightweight drift prevention and alignment guardrails for normal multi-turn work
- `context-continuity-anchor` (`cca`): stateful continuation, handoff, and recovery for long-running or cross-window tasks

## How they work together

Default to `agent-drift-guard`.

Upgrade to `context-continuity-anchor` when:

- the task spans multiple rounds or windows
- important state should not live only in chat history
- the main blockage is about scope, state, or boundary handling
- you need to take over an already-running discussion mid-stream

## Quick start

1. Install `skills/agent-drift-guard/` into your Codex skills directory.
2. Install `skills/context-continuity-anchor/` into the same skills directory.
3. Start with `agent-drift-guard` for normal multi-turn work.
4. Switch to `context-continuity-anchor` when the task needs stronger stateful continuation.

The second skill keeps `alias: cca`, so it can still be invoked as `cca`.

## Repository layout

- `skills/agent-drift-guard/`: lightweight guardrails and upgrade routing
- `skills/context-continuity-anchor/`: system rules, layered continuation model, and instance scaffold

## Publishing boundary

This repository does not publish local working material:

- `refactor-work/` is local-only refactor state
- real local instances such as `personal-design-portrait` are not part of the published skill set

`refactor-work/` is ignored by `.gitignore` to reduce accidental commits.

## Installation shape

Each skill is designed to live in its own folder under a Codex skills directory:

- `agent-drift-guard`
- `context-continuity-anchor`

The `context-continuity-anchor` skill keeps `alias: cca`, so it can still be invoked as `cca`.
