# Transcript-Style Demo

This demo shows the kind of failure ACH is designed to prevent.

## Scenario

A user is working with an AI agent on a multi-step repository cleanup. The task
will continue later, and the current chat is already mixing confirmed decisions,
possible ideas, and unresolved questions.

## Input

```text
Use ACH for this task.

We are cleaning up a public GitHub repo. The repo is already ACH.
Do not treat this as a rename or migration project.

Current goal:
- improve the GitHub product surface so strangers understand, try, trust, and
  share the project

Confirmed constraints:
- ACH is the public product name
- guard-mode and continuity-mode are internal modes
- do not expand core internal rules

Pending:
- add quickstart and concrete demo
- prepare trust and distribution docs
```

## Likely Failure Without ACH

The agent may continue from only the latest phrase, such as "make it a higher
star GitHub project," and accidentally reopen settled identity decisions:

```text
We should first decide whether this is a guard project, a continuity project,
or a new brand, then rewrite the repo identity around that choice.
```

That is wrong because the identity is already settled.

## ACH Behavior

ACH should keep the task lightweight unless continuity state is actually needed.
In `guard-mode`, it should recover the active boundary before proceeding:

```text
Recovered boundary:
- This is not a rename or migration task.
- ACH is already the public product identity.
- Current work is GitHub productization: understand, try, trust, share.
- Internal modes remain internal.

Next smallest useful step:
- add quickstart/install docs and one concrete demo before adding heavier
  release or distribution infrastructure.
```

If the user later asks to switch chats, ACH may enter `continuity-mode` and
preserve this as formal handoff state.

## Result

The agent improves the repository surface without reopening settled decisions.
The user does not need to restate that ACH is already the project identity.

## What This Proves

ACH is useful when the risk is not missing skill or missing tools, but losing
the task line during long-running collaboration.
