# When Not To Use ACH

ACH is intentionally narrow. It should not turn every interaction into a process.

Do not use ACH when:

- the task is a single short question
- the next step is obvious and low-risk
- there is no future recovery or handoff requirement
- the answer does not depend on preserving state
- normal project instructions are enough

## Better Without ACH

```text
Fix this typo.
```

```text
What does this error message mean?
```

```text
Run the unit tests and tell me whether they pass.
```

These tasks should stay simple. ACH becomes useful when the task line itself is
at risk: drift, handoff, recovery, or continuity.

## Rule of Thumb

Use normal conversation for short work. Use ACH when losing the task state would
cost more than the overhead of stabilizing it.
