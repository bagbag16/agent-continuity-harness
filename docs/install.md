# Install

ACH has two install targets. Use one or both.

## One-Line Installs

### Codex Skill Only

Use this when you want Codex conversations to invoke ACH.

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null; git clone https://github.com/bagbag16/agent-continuity-harness.git "$env:USERPROFILE\.codex\skills\ach"
```

macOS or Linux:

```bash
mkdir -p ~/.codex/skills && git clone https://github.com/bagbag16/agent-continuity-harness.git ~/.codex/skills/ach
```

Then restart or reload Codex and ask:

```text
Use ACH for this task.
```

### CLI Only

Use this when you want the terminal command `ach`.
Until an npm registry release exists, install the CLI from GitHub:

```bash
npm install -g github:bagbag16/agent-continuity-harness
```

Then verify:

```bash
ach --help
```

To run the demo fixtures, use a repository checkout.

### Both Codex Skill And CLI

Windows PowerShell:

```powershell
npm install -g github:bagbag16/agent-continuity-harness; New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null; git clone https://github.com/bagbag16/agent-continuity-harness.git "$env:USERPROFILE\.codex\skills\ach"
```

macOS or Linux:

```bash
npm install -g github:bagbag16/agent-continuity-harness && mkdir -p ~/.codex/skills && git clone https://github.com/bagbag16/agent-continuity-harness.git ~/.codex/skills/ach
```

### Update Later

Update the CLI:

```bash
npm install -g github:bagbag16/agent-continuity-harness
```

Update the Codex skill:

```bash
git -C ~/.codex/skills/ach pull
```

On Windows PowerShell:

```powershell
git -C "$env:USERPROFILE\.codex\skills\ach" pull
```

## 1. Install As A Codex Skill

Use this when you want Codex conversations to invoke ACH with:

```text
Use ACH for this task.
```

Install shape:

```text
<codex-home>/skills/ach/
  SKILL.md
  agents/
  assets/
  references/
  examples/
  docs/
  schemas/
  bin/
  scripts/
```

On Windows, the usual local path is:

```text
C:\Users\<you>\.codex\skills\ach
```

Manual install:

1. Clone or download this repository.
2. Copy the repository folder into your Codex skills directory.
3. Rename the copied folder to `ach`.
4. Restart or reload Codex so it discovers the skill.
5. Ask Codex to use ACH for a long-running task.

Local sync from a checkout:

```powershell
.\scripts\sync-installed-skill.ps1
```

ACH is installed correctly when Codex shows one public skill named `ach`. Do
not install `references/adg` or `references/cca` as separate skills.

## 2. Install The CLI

Use this when you want a terminal command that can create, validate, handoff,
and preflight ACH state roots.

From a local checkout:

```bash
git clone https://github.com/bagbag16/agent-continuity-harness.git
cd agent-continuity-harness
npm link
ach validate examples/fixtures/valid-basic
```

Without linking, run the CLI directly:

```bash
node bin/ach.js validate examples/fixtures/valid-basic
node bin/ach.js init my-long-task
node bin/ach.js preflight my-long-task
```

The CLI does not make an agent follow ACH by itself. It makes the state contract
checkable so agents and humans can recover from the same source of truth.

## Which One Do I Need?

- Use the Codex skill if the problem is conversation drift or handoff inside
  Codex.
- Use the CLI if the problem is validating or generating durable state in a
  workspace.
- Use both when you want Codex to follow ACH and also want CI or terminal checks
  for the state root.
- For other clients, use the CLI plus the integration notes under
  `docs/integrations/`.
