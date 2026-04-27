# Contributing

Thanks for considering a contribution to ACH.

ACH is a continuity harness for long-running AI agent work. Contributions should
improve one of four public outcomes:

- understand
- try
- trust
- share

## What Fits

Good contributions:

- clearer examples
- better quickstart or install instructions
- validator, schema, fixture, or CLI improvements that preserve the ACH state contract
- concise FAQ improvements
- real-world use cases
- fixes to consistency, wording, or broken links
- small improvements to state templates

## What Does Not Fit

Avoid contributions that:

- publish internal modes as separate public products
- expand core internal rules without a concrete failure case
- turn the CLI into an agent runtime or memory platform
- turn simple tasks into mandatory process
- store assumptions as confirmed facts

## Style

Public docs should use:

- `ACH` as the product name
- `Agent Continuity Harness` as the full name
- `guard-mode` and `continuity-mode` as internal modes
- short examples over long theory
- concrete failure patterns over abstract claims

## Pull Request Checklist

Before opening a pull request:

- Check that the change improves understand, try, trust, or share.
- Keep public wording consistent with README.
- Do not introduce a second public product name.
- Do not introduce a second state protocol outside `.cca-bindings.json` and the formal state root.
- Add or update an example when changing behavior-facing docs.
- Run `npm test` when changing CLI, schema, fixtures, or state-contract docs.
- Run the skill validation script when changing `SKILL.md`.
