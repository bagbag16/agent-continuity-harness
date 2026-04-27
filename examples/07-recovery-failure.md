# Recovery Failure Without ACH

## Failure Pattern

A long-running AI task changes direction midstream. A new chat receives a short
summary, but the summary does not preserve which constraints were confirmed,
which items were pending, and which decisions were replaced.

## Baseline Handoff

```text
Continue the dashboard project. We decided to simplify the design and add
export later.
```

## What Goes Wrong

- "Simplify the design" does not say which constraints are confirmed.
- "Add export later" does not say whether export is pending, rejected, or merely
  deferred.
- The next chat may treat a weak suggestion as a confirmed decision.
- There is no validator to detect missing state.

## Result

The new chat can continue fluently but may inherit the wrong task state.

This is the failure ACH is meant to prevent.
