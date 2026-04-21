param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$DistRoot
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

if (-not $DistRoot) {
    $DistRoot = Join-Path $WorkspaceRoot "dist\ach"
}

$codexHome = if ($env:CODEX_HOME) {
    $env:CODEX_HOME
} else {
    Join-Path $HOME ".codex"
}

$validator = Join-Path $codexHome "skills\.system\skill-creator\scripts\quick_validate.py"
if (-not (Test-Path $validator)) {
    throw "Missing quick validator at $validator. Set CODEX_HOME correctly or install the skill-creator system skill."
}

$requiredPaths = @(
    (Join-Path $DistRoot "SKILL.md"),
    (Join-Path $DistRoot "agents\openai.yaml"),
    (Join-Path $DistRoot "references\adg\guard.md"),
    (Join-Path $DistRoot "references\cca\entry.md"),
    (Join-Path $DistRoot "references\cca\system.md"),
    (Join-Path $DistRoot "references\cca\inner.md"),
    (Join-Path $DistRoot "references\cca\outer.md"),
    (Join-Path $DistRoot "assets\state-templates\README.md"),
    (Join-Path $DistRoot "assets\state-templates\cca-bindings.template.json"),
    (Join-Path $DistRoot "assets\state-templates\state-manifest.template.json")
)

foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        throw "Missing required bundle path: $path"
    }
}

$forbiddenPaths = @(
    (Join-Path $DistRoot ".cca-state"),
    (Join-Path $DistRoot ".cca-bindings.json"),
    (Join-Path $DistRoot "refactor-work")
)

foreach ($path in $forbiddenPaths) {
    if (Test-Path $path) {
        throw "Forbidden runtime/local path leaked into bundle: $path"
    }
}

$bundleFiles = Get-ChildItem -Path $DistRoot -Recurse -File
$contentMatches = Select-String -Path $bundleFiles.FullName -Pattern 'C:\\Users\\|Desktop\\我的看板|personal-design-portrait|refactor-work/'

if ($contentMatches) {
    $details = ($contentMatches | ForEach-Object { "{0}:{1}" -f $_.Path, $_.LineNumber }) -join "; "
    throw "Bundle content still contains local/private markers: $details"
}

$staleSourceLinks = Select-String -Path $bundleFiles.FullName -Pattern '\./adg/SKILL.md|\./cca/SKILL.md|skills/agent-drift-guard|skills/context-continuity-anchor'
if ($staleSourceLinks) {
    $details = ($staleSourceLinks | ForEach-Object { "{0}:{1}" -f $_.Path, $_.LineNumber }) -join "; "
    throw "Bundle still contains source-layout links: $details"
}

$vendorPython = Join-Path $WorkspaceRoot ".vendor\python"
$pythonModulePath = $null

if (Test-Path (Join-Path $vendorPython "yaml")) {
    $pythonModulePath = $vendorPython
} else {
    $pythonUserSite = (python -X utf8 -c "import site; print(site.getusersitepackages())" | Select-Object -Last 1).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to determine Python user site-packages path."
    }
    $pythonModulePath = $pythonUserSite
}

$validatorBootstrap = @'
import runpy
import sys

sys.path.insert(0, sys.argv[1])
sys.argv = sys.argv[2:]
runpy.run_path(sys.argv[0], run_name='__main__')
'@

python -X utf8 -c "import sys; sys.path.insert(0, sys.argv[1]); import yaml; print(yaml.__version__)" $pythonModulePath | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "PyYAML is not available to the validator. Install it for the active Python interpreter or place a readable copy under .vendor\\python."
}

python -X utf8 -c $validatorBootstrap $pythonModulePath $validator $DistRoot
if ($LASTEXITCODE -ne 0) {
    throw "quick_validate.py failed for $DistRoot with exit code $LASTEXITCODE"
}

@(
    "ach-bundle-validation summary",
    ("dist-root: {0}" -f $DistRoot),
    ("validator: {0}" -f $validator),
    "result: bundle is valid"
) -join "`n"
