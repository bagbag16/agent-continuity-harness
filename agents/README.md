# agents/

Optional per-client interface metadata for the ACH skill.

- `openai.yaml` — display name, short description, and a suggested default
  prompt for clients that read an agent interface file (for example
  Codex-style skill loaders). It contains no executable logic.

If your client does not read this file, you lose nothing: the skill behavior
is fully defined by [SKILL.md](../SKILL.md), and the CLI works independently
of it. See [docs/integrations/](../docs/integrations/) for client-specific
setup notes.
