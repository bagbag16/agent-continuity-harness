param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$SourceBranch = "main",
    [string]$ReleaseBranch = "release-ach",
    [string]$ReleaseWorktree
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$repoRoot = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$distRoot = Join-Path $repoRoot "dist\ach"
$releaseReadme = Join-Path $repoRoot "src\ach\README.release.md"

if (-not $ReleaseWorktree) {
    $repoParent = Split-Path -Parent $repoRoot
    $repoName = Split-Path -Leaf $repoRoot
    $ReleaseWorktree = Join-Path $repoParent ("{0}-{1}" -f $repoName, $ReleaseBranch)
}

$releaseWorktree = [System.IO.Path]::GetFullPath($ReleaseWorktree)
$releaseParent = Split-Path -Parent $releaseWorktree

if (-not (Test-Path $releaseParent)) {
    New-Item -ItemType Directory -Force -Path $releaseParent | Out-Null
}

& (Join-Path $repoRoot "scripts\build-ach-bundle.ps1") -WorkspaceRoot $repoRoot -DistRoot $distRoot | Out-Null

if (-not (Test-Path $releaseReadme)) {
    throw "Missing release branch README template: $releaseReadme"
}

$repoGitArgs = @(
    "-c", "safe.directory=$repoRoot",
    "-C", $repoRoot
)

if (Test-Path $releaseWorktree) {
    $gitLink = Join-Path $releaseWorktree ".git"
    if (-not (Test-Path $gitLink)) {
        throw "Refusing to reuse non-worktree directory: $releaseWorktree"
    }

    & git @repoGitArgs worktree remove --force $releaseWorktree
}

& git @repoGitArgs worktree add --force -B $ReleaseBranch $releaseWorktree $SourceBranch | Out-Null

$trackedItems = Get-ChildItem -Force $releaseWorktree | Where-Object { $_.Name -ne ".git" }
foreach ($item in $trackedItems) {
    Remove-Item -Recurse -Force $item.FullName
}

Copy-Item -Recurse -Force (Join-Path $distRoot "*") $releaseWorktree
Copy-Item -LiteralPath $releaseReadme -Destination (Join-Path $releaseWorktree "README.md") -Force

$releaseGitArgs = @(
    "-c", "safe.directory=$releaseWorktree",
    "-C", $releaseWorktree
)

& git @releaseGitArgs add -A
$status = (& git @releaseGitArgs status --short).Trim()

if ($status) {
    $sourceSha = (& git @repoGitArgs rev-parse --short $SourceBranch).Trim()
    & git @releaseGitArgs commit -m ("publish ach bundle from {0}" -f $sourceSha) | Out-Null
    $commitCreated = $true
} else {
    $commitCreated = $false
}

@(
    "ach-release-publish summary",
    ("repo-root: {0}" -f $repoRoot),
    ("source-branch: {0}" -f $SourceBranch),
    ("release-branch: {0}" -f $ReleaseBranch),
    ("release-worktree: {0}" -f $releaseWorktree),
    ("dist-root: {0}" -f $distRoot),
    ("commit-created: {0}" -f $commitCreated)
) -join "`n"
