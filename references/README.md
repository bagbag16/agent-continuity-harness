# references/ — internal architecture documentation

**This directory is for contributors and maintainers, not for normal ACH use.**

- `design-constraints.md` — the principles behind ACH's architectural choices
- `architecture-branch-map.md` — key branch points in the project's design
- `cca/` — the formal continuity-mode reference material
- `adg/` — the guard-mode reference material

Do not:

- install `references/adg` or `references/cca` as separate skills
  (see [CONTRIBUTING.md](../CONTRIBUTING.md))
- rely on these files for day-to-day usage — they may change without notice
- treat them as API contracts; the public contract is
  [docs/state-contract.md](../docs/state-contract.md)

To get started as a user, see the [main README](../README.md).
