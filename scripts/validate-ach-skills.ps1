param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [ValidateSet("repo", "active", "both")]
    [string]$Target = "repo",
    [string]$ActiveSkillsRoot
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$codexHome = if ($env:CODEX_HOME) {
    $env:CODEX_HOME
} else {
    Join-Path $HOME ".codex"
}

if (-not $ActiveSkillsRoot) {
    $ActiveSkillsRoot = Join-Path $codexHome "skills"
}

$validator = Join-Path $codexHome "skills\.system\skill-creator\scripts\quick_validate.py"
$skills = @(
    "ach",
    "agent-continuity-harness",
    "agent-drift-guard",
    "context-continuity-anchor"
)

if (-not (Test-Path $validator)) {
    throw "Missing quick validator at $validator. Set CODEX_HOME correctly or install the skill-creator system skill."
}

Write-Output "ach-skill-validation summary"
Write-Output "workspace: $WorkspaceRoot"
Write-Output "validator: $validator"
$targets = switch ($Target) {
    "repo" {
        @(
            @{
                Name = "repo"
                Root = Join-Path $WorkspaceRoot "skills"
            }
        )
    }
    "active" {
        @(
            @{
                Name = "active"
                Root = $ActiveSkillsRoot
            }
        )
    }
    "both" {
        @(
            @{
                Name = "repo"
                Root = Join-Path $WorkspaceRoot "skills"
            },
            @{
                Name = "active"
                Root = $ActiveSkillsRoot
            }
        )
    }
}

foreach ($targetInfo in $targets) {
    Write-Output ("target: {0}" -f $targetInfo.Name)
    Write-Output ("skills-root: {0}" -f $targetInfo.Root)
    foreach ($skill in $skills) {
        $skillPath = Join-Path $targetInfo.Root $skill
        if (-not (Test-Path $skillPath)) {
            throw "Missing skill at $skillPath"
        }
        Write-Output ("validating skill: {0}" -f $skill)
        python -X utf8 $validator $skillPath
    }
}

Write-Output "running state integrity checker"
& (Join-Path $WorkspaceRoot "scripts\check-cca-state.ps1") -WorkspaceRoot $WorkspaceRoot
