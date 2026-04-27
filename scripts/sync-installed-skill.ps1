param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$SkillRoot = (Join-Path $env:USERPROFILE '.codex\skills\ach')
)

$items = @(
  'SKILL.md',
  'agents',
  'assets',
  'references',
  'examples',
  'docs',
  'schemas',
  'bin',
  'scripts',
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE'
)

New-Item -ItemType Directory -Force -Path $SkillRoot | Out-Null

foreach ($item in $items) {
  $source = Join-Path $RepoRoot $item
  $target = Join-Path $SkillRoot $item

  if (!(Test-Path -LiteralPath $source)) {
    Write-Warning "Skipping missing item: $item"
    continue
  }

  $entry = Get-Item -LiteralPath $source
  if ($entry.PSIsContainer) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
  } else {
    Copy-Item -LiteralPath $source -Destination $target -Force
  }
}

Write-Host "Synced ACH skill to $SkillRoot"
