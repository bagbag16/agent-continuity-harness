param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [switch]$IncludeLocalStateCheck
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$sourceRoot = Join-Path $WorkspaceRoot "src\ach"
$distRoot = Join-Path $WorkspaceRoot "dist\ach"

$requiredSourcePaths = @(
    (Join-Path $sourceRoot "SKILL.md"),
    (Join-Path $sourceRoot "agents\openai.yaml"),
    (Join-Path $sourceRoot "adg\SKILL.md"),
    (Join-Path $sourceRoot "cca\SKILL.md"),
    (Join-Path $sourceRoot "cca\SYSTEM.md"),
    (Join-Path $sourceRoot "cca\INNER.md"),
    (Join-Path $sourceRoot "cca\OUTER.md"),
    (Join-Path $sourceRoot "cca\state-templates\README.md")
)

foreach ($path in $requiredSourcePaths) {
    if (-not (Test-Path $path)) {
        throw "Missing required source path: $path"
    }
}

Write-Output "ach-repo-validation summary"
Write-Output ("workspace: {0}" -f $WorkspaceRoot)
Write-Output ("source-root: {0}" -f $sourceRoot)

& (Join-Path $WorkspaceRoot "scripts\build-ach-bundle.ps1") -WorkspaceRoot $WorkspaceRoot -SourceRoot $sourceRoot -DistRoot $distRoot
& (Join-Path $WorkspaceRoot "scripts\validate-ach-bundle.ps1") -WorkspaceRoot $WorkspaceRoot -DistRoot $distRoot

if ($IncludeLocalStateCheck) {
    & (Join-Path $WorkspaceRoot "scripts\check-cca-state.ps1") -WorkspaceRoot $WorkspaceRoot
} else {
    Write-Output "local-state-check: skipped (pass -IncludeLocalStateCheck to validate private .cca-state data)"
}
