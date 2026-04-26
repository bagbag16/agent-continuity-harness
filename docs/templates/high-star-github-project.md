# High-Star GitHub Project Template

Use this template when turning a useful technical idea into a GitHub project
that strangers can understand, try, trust, and share.

The goal is not to make the repository look bigger. The goal is to reduce the
time between "I found this repo" and "I understand why this is worth starring."

Occam's razor in this template is a necessity rule, not a small-change rule:
add the entity that is needed, remove the entity that is not needed, and merge
entities that answer the same visitor question.

## 0. Necessity Gate

Before adding or keeping any artifact, identify the visitor decision it helps:

- understand: "What is this, and why should I care?"
- try: "Can I use it quickly and see the expected behavior?"
- trust: "Is this maintained enough to depend on or contribute to?"
- share: "Can I explain this project to someone else without rewriting it?"

Keep an artifact only when it improves at least one decision better than an
existing artifact can. Add a new artifact when merging would make the visitor
path harder. Delete or merge an artifact when it only repeats another page.

The minimum useful architecture is not a fixed file count. It is the smallest
set of public artifacts that covers understand, try, trust, and share without
forcing users through internal implementation details.

## 1. Repository Identity

Define the project in one sentence.

```text
<Project name> is a <category> for <target user> that helps <main outcome>.
```

Good identity answers:

- what category the project belongs to
- who should care
- what problem it solves
- what it is not

Avoid:

- internal codenames as the main explanation
- vague "AI productivity" wording
- positioning that competes with unrelated large frameworks

## 2. First Viewport

The first screen of the README should answer four questions:

1. What is this?
2. What pain does it solve?
3. How do I try it?
4. Why is it different from things I already know?

Recommended structure:

```md
# Project Name

**One-sentence promise.**

Short paragraph: what it is, who it is for, what it prevents or enables.

## The Problem
3-5 concrete failure modes.

## Quick Start
Copy-paste setup and first-use prompt/command.

## Example
One small before/after or input/output example.

## How It Differs
Short comparison table against familiar alternatives.
```

## 3. Trial Path

A high-star project should let a visitor try something quickly.

Minimum trial assets:

- one quickstart path, usually `docs/quickstart.md`
- install instructions inside quickstart unless installation is complex enough
  to need its own page
- one copy-paste command or prompt
- one expected output or behavior sample
- a "when not to use" warning

Acceptance test:

- a new user can start in 1 minute
- a new user can judge relevance in 3 minutes
- the trial does not require understanding the full architecture

## 4. Proof Layer

Do not only explain value. Show the failure and the fix.

Proof assets:

- before/after examples
- transcript-style demos
- small use cases with expected behavior
- "what this prevents" bullets
- known limits and non-goals

Each example should include:

```md
## Failure Pattern
What goes wrong without the project.

## Input
What the user or system does.

## Project Behavior
What the project changes.

## Result
What is now safer, faster, or easier.
```

## 5. Trust Layer

Trust material helps visitors decide whether the project is maintained and safe
to adopt.

Minimum trust assets:

- `LICENSE`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- a small `.github/ISSUE_TEMPLATE/` set for distinct issue classes
- release notes only when they add value beyond `CHANGELOG.md`

Do not overbuild governance. Add only enough structure for feedback, issues,
and lightweight contribution.

## 6. Distribution Layer

A good repository should include language other people can reuse when sharing
it.

Distribution assets:

- one short launch post
- one technical launch note
- short answers to common objections
- repo description and topic suggestions
- optional social preview guidance

## 7. Consistency Rules

Every public artifact must use the same:

- project name
- category
- target user
- core problem
- primary call to action
- non-goals

Internal implementation terms may appear in technical docs, but they should not
become competing public product names.

## 8. Self-Check

Before calling the project surface ready, check:

- Can a stranger explain the project after reading the first screen?
- Can a stranger try it without reading internals?
- Can a stranger see why it differs from familiar alternatives?
- Can a stranger find proof, not only claims?
- Can a stranger find project changes or open an issue?
- Does every artifact improve understanding, trial, trust, or sharing?

If an artifact does not improve one of those outcomes, defer it.
