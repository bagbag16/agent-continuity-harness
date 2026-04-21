param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$SourceRoot,
    [string]$DistRoot
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

if (-not $SourceRoot) {
    $SourceRoot = Join-Path $WorkspaceRoot "src\ach"
}

if (-not $DistRoot) {
    $DistRoot = Join-Path $WorkspaceRoot "dist\ach"
}

function Assert-Exists {
    param([string]$PathToCheck)
    if (-not (Test-Path $PathToCheck)) {
        throw "Missing required source path: $PathToCheck"
    }
}

function Get-FileText {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Set-FileText {
    param(
        [string]$Path,
        [string]$Content
    )
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Remove-Frontmatter {
    param([string]$Content)
    if ($Content.StartsWith("---`n") -or $Content.StartsWith("---`r`n")) {
        $lines = $Content -split "`r?`n"
        $endIndex = -1
        for ($i = 1; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -eq "---") {
                $endIndex = $i
                break
            }
        }
        if ($endIndex -gt 0) {
            return (($lines[($endIndex + 1)..($lines.Length - 1)]) -join "`n").TrimStart()
        }
    }
    return $Content
}

$requiredPaths = @(
    (Join-Path $SourceRoot "SKILL.md"),
    (Join-Path $SourceRoot "agents\openai.yaml"),
    (Join-Path $SourceRoot "adg\SKILL.md"),
    (Join-Path $SourceRoot "adg\references\checklist.md"),
    (Join-Path $SourceRoot "adg\references\scope.md"),
    (Join-Path $SourceRoot "adg\references\update-rules.md"),
    (Join-Path $SourceRoot "adg\references\upgrade-to-cca.md"),
    (Join-Path $SourceRoot "adg\references\workflow.md"),
    (Join-Path $SourceRoot "cca\SKILL.md"),
    (Join-Path $SourceRoot "cca\SYSTEM.md"),
    (Join-Path $SourceRoot "cca\INNER.md"),
    (Join-Path $SourceRoot "cca\OUTER.md"),
    (Join-Path $SourceRoot "cca\state-templates\README.md"),
    (Join-Path $SourceRoot "cca\state-templates\cca-bindings.template.json"),
    (Join-Path $SourceRoot "cca\state-templates\confirmed-constraints.template.md"),
    (Join-Path $SourceRoot "cca\state-templates\current-goal.template.md"),
    (Join-Path $SourceRoot "cca\state-templates\decisions.template.md"),
    (Join-Path $SourceRoot "cca\state-templates\pending-items.template.md"),
    (Join-Path $SourceRoot "cca\state-templates\state-manifest.template.json")
)

foreach ($path in $requiredPaths) {
    Assert-Exists -PathToCheck $path
}

if (Test-Path $DistRoot) {
    Remove-Item -LiteralPath $DistRoot -Recurse -Force
}

$distDirs = @(
    $DistRoot,
    (Join-Path $DistRoot "agents"),
    (Join-Path $DistRoot "references"),
    (Join-Path $DistRoot "references\adg"),
    (Join-Path $DistRoot "references\cca"),
    (Join-Path $DistRoot "assets"),
    (Join-Path $DistRoot "assets\state-templates")
)

foreach ($dir in $distDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$entryText = Get-FileText -Path (Join-Path $SourceRoot "SKILL.md")
$entryText = $entryText.Replace("./adg/SKILL.md", "./references/adg/guard.md")
$entryText = $entryText.Replace("./cca/SKILL.md", "./references/cca/entry.md")
Set-FileText -Path (Join-Path $DistRoot "SKILL.md") -Content $entryText

Copy-Item -LiteralPath (Join-Path $SourceRoot "agents\openai.yaml") -Destination (Join-Path $DistRoot "agents\openai.yaml") -Force

$guardEntry = Remove-Frontmatter -Content (Get-FileText -Path (Join-Path $SourceRoot "adg\SKILL.md"))
Set-FileText -Path (Join-Path $DistRoot "references\adg\guard.md") -Content $guardEntry

$adgRefFiles = @("checklist.md", "scope.md", "update-rules.md", "upgrade-to-cca.md", "workflow.md")
foreach ($file in $adgRefFiles) {
    Copy-Item -LiteralPath (Join-Path $SourceRoot ("adg\references\" + $file)) -Destination (Join-Path $DistRoot ("references\adg\" + $file)) -Force
}

$ccaFiles = @{
    "SKILL.md"  = "entry.md"
    "SYSTEM.md" = "system.md"
    "INNER.md"  = "inner.md"
    "OUTER.md"  = "outer.md"
}

foreach ($sourceName in $ccaFiles.Keys) {
    $targetName = $ccaFiles[$sourceName]
    $content = Remove-Frontmatter -Content (Get-FileText -Path (Join-Path $SourceRoot ("cca\" + $sourceName)))
    $content = $content.Replace("SYSTEM.md", "system.md")
    $content = $content.Replace("INNER.md", "inner.md")
    $content = $content.Replace("OUTER.md", "outer.md")
    $content = $content.Replace("state-templates/", "../../assets/state-templates/")
    Set-FileText -Path (Join-Path $DistRoot ("references\cca\" + $targetName)) -Content $content
}

$templateFiles = @(
    "README.md",
    "cca-bindings.template.json",
    "confirmed-constraints.template.md",
    "current-goal.template.md",
    "decisions.template.md",
    "pending-items.template.md",
    "state-manifest.template.json"
)

foreach ($file in $templateFiles) {
    Copy-Item -LiteralPath (Join-Path $SourceRoot ("cca\state-templates\" + $file)) -Destination (Join-Path $DistRoot ("assets\state-templates\" + $file)) -Force
}

$summary = @(
    "ach-bundle-build summary",
    ("workspace: {0}" -f $WorkspaceRoot),
    ("source-root: {0}" -f $SourceRoot),
    ("dist-root: {0}" -f $DistRoot),
    "copied-groups: entry, agents, adg references, cca references, state templates"
)

$summary -join "`n"
