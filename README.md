# Drift Guard and Handoff Skills for Long-Running Agents

This repository publishes two Codex skills for stable, long-running AI collaboration:

- `agent-drift-guard` (`adg`): lightweight guardrails for normal multi-turn work
- `context-continuity-anchor` (`cca`): stateful continuation, handoff, and recovery for work that must survive beyond the current chat

## How to use them

Default to `agent-drift-guard`.

Switch to `context-continuity-anchor` when:

- the task must survive across multiple rounds, windows, or a new conversation
- important state should not live only in chat history
- the main blockage is about continuity, scope, state, or boundary handling
- you need to take over an already-running discussion mid-stream

## Why these skills exist

Most skills add domain knowledge, workflows, or tool usage.

These two skills solve a different problem: keeping long-running collaboration stable when the failure mode is drift or broken continuity rather than missing capability.

- `agent-drift-guard` is necessary when the problem is not lack of capability, but drift during normal multi-turn work. It helps keep confirmed facts, assumptions, pending items, and user intent from silently collapsing into each other.
- `context-continuity-anchor` is necessary when the task must survive beyond the current chat. It provides explicit continuation, handoff, and recovery across long tasks, cross-window work, or a new conversation.

In short:

- most skills help an agent do more
- `adg` helps an agent stay aligned while doing it
- `cca` helps an agent continue coherently when the work outgrows chat-only memory or moves into a new conversation

## Install

Install both folders under your Codex skills directory:

- `skills/agent-drift-guard/`
- `skills/context-continuity-anchor/`

Invocation aliases:

- `agent-drift-guard` -> `adg`
- `context-continuity-anchor` -> `cca`

## Repository layout

- `skills/agent-drift-guard/`: lightweight guardrails and upgrade routing
- `skills/context-continuity-anchor/`: system rules, layered continuation model, and instance scaffold

## Publishing boundary

This repository does not publish local working material:

- `refactor-work/` is local-only refactor state
- real local instances such as `personal-design-portrait` are not part of the published skill set

`refactor-work/` is ignored by `.gitignore` to reduce accidental commits.
