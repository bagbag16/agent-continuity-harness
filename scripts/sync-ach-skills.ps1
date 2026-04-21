param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$ActiveSkillsRoot,
    [switch]$NoBackup
)

$ErrorActionPreference = "Stop"

$codexHome = if ($env:CODEX_HOME) {
    $env:CODEX_HOME
} else {
    Join-Path $HOME ".codex"
}

if (-not $ActiveSkillsRoot) {
    $ActiveSkillsRoot = Join-Path $codexHome "skills"
}

$skills = @(
    "ach",
    "agent-continuity-harness",
    "agent-drift-guard",
    "context-continuity-anchor"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ActiveSkillsRoot "_ach-sync-backups"

Write-Output "ach-skill-sync summary"
Write-Output "workspace: $WorkspaceRoot"
Write-Output "active-skills-root: $ActiveSkillsRoot"

if (-not (Test-Path $ActiveSkillsRoot)) {
    throw "Missing active skills root at $ActiveSkillsRoot"
}

if (-not $NoBackup) {
    New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
    Write-Output "backup-root: $backupRoot"
}

foreach ($skill in $skills) {
    $source = Join-Path $WorkspaceRoot ("skills\" + $skill)
    $destination = Join-Path $ActiveSkillsRoot $skill

    if (-not (Test-Path $source)) {
        throw "Missing source skill at $source"
    }

    if (Test-Path $destination) {
        if ($NoBackup) {
            Remove-Item -LiteralPath $destination -Recurse -Force
            Write-Output ("removed-existing: {0}" -f $destination)
        } else {
            $backupPath = Join-Path $backupRoot ("{0}-{1}" -f $skill, $timestamp)
            Move-Item -LiteralPath $destination -Destination $backupPath
            Write-Output ("backed-up: {0} -> {1}" -f $destination, $backupPath)
        }
    }

    Copy-Item -LiteralPath $source -Destination $destination -Recurse
    Write-Output ("installed: {0}" -f $destination)
}
