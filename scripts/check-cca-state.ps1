param(
    [string]$WorkspaceRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

function Resolve-NormalizedPath {
    param(
        [string]$BasePath,
        [string]$RelativePath
    )

    $combined = Join-Path $BasePath $RelativePath
    return [System.IO.Path]::GetFullPath($combined)
}

function Get-RelativePathSafe {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    try {
        $base = [System.IO.Path]::GetFullPath($BasePath)
        $target = [System.IO.Path]::GetFullPath($TargetPath)
        return [System.IO.Path]::GetRelativePath($base, $target)
    } catch {
        return $TargetPath
    }
}

function Test-IsUnderPath {
    param(
        [string]$Path,
        [string]$Ancestor
    )

    $normalizedPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\')
    $normalizedAncestor = [System.IO.Path]::GetFullPath($Ancestor).TrimEnd('\')

    if ($normalizedPath -eq $normalizedAncestor) {
        return $true
    }

    return $normalizedPath.StartsWith($normalizedAncestor + '\', [System.StringComparison]::OrdinalIgnoreCase)
}

function Add-Finding {
    param(
        [System.Collections.Generic.List[object]]$Findings,
        [string]$Level,
        [string]$Code,
        [string]$Message,
        [string]$Path
    )

    $Findings.Add([pscustomobject]@{
        level = $Level
        code = $Code
        message = $Message
        path = $Path
    })
}

function Test-FormalStateRootShape {
    param(
        [string]$DirectoryPath
    )

    $required = @(
        "current-goal.md",
        "confirmed-constraints.md",
        "pending-items.md",
        "decisions.md"
    )

    foreach ($name in $required) {
        if (-not (Test-Path (Join-Path $DirectoryPath $name))) {
            return $false
        }
    }

    return $true
}

$workspaceRoot = [System.IO.Path]::GetFullPath($WorkspaceRoot)
$bindingsPath = Join-Path $workspaceRoot ".cca-bindings.json"
$stateContainer = Join-Path $workspaceRoot ".cca-state"
$requiredFiles = @(
    "current-goal.md",
    "confirmed-constraints.md",
    "pending-items.md",
    "decisions.md",
    "state-manifest.json"
)
$derivedPatterns = @(
    "run-state-short*.md",
    "*handoff*.md",
    "*交接摘要*.md",
    "*run-state*.md"
)

$findings = New-Object 'System.Collections.Generic.List[object]'

if (-not (Test-Path $bindingsPath)) {
    Add-Finding -Findings $findings -Level "ERROR" -Code "missing-bindings" -Message "Missing workspace binding index." -Path $bindingsPath
} else {
    $bindingsJson = Get-Content -Raw -Encoding UTF8 $bindingsPath | ConvertFrom-Json

    if (-not $bindingsJson.bindings) {
        Add-Finding -Findings $findings -Level "ERROR" -Code "invalid-bindings" -Message "Binding index has no bindings object." -Path $bindingsPath
    } else {
        $resolvedRoots = @{}

        foreach ($bindingProperty in $bindingsJson.bindings.PSObject.Properties) {
            $taskKey = $bindingProperty.Name
            $binding = $bindingProperty.Value
            $relativeRoot = $binding.formal_state_root

            if (-not $relativeRoot) {
                Add-Finding -Findings $findings -Level "ERROR" -Code "missing-formal-root" -Message "Binding has no formal_state_root." -Path $bindingsPath
                continue
            }

            $resolvedRoot = Resolve-NormalizedPath -BasePath $workspaceRoot -RelativePath $relativeRoot

            if ($resolvedRoots.ContainsKey($resolvedRoot)) {
                Add-Finding -Findings $findings -Level "ERROR" -Code "binding-conflict" -Message "Multiple task keys point to the same formal state root." -Path $resolvedRoot
            } else {
                $resolvedRoots[$resolvedRoot] = $taskKey
            }

            if (-not (Test-Path $resolvedRoot)) {
                Add-Finding -Findings $findings -Level "ERROR" -Code "missing-formal-root-dir" -Message "Bound formal state root directory does not exist." -Path $resolvedRoot
                continue
            }

            foreach ($requiredFile in $requiredFiles) {
                $requiredPath = Join-Path $resolvedRoot $requiredFile
                if (-not (Test-Path $requiredPath)) {
                    Add-Finding -Findings $findings -Level "ERROR" -Code "recovery-incomplete" -Message "Formal state root is missing a required file." -Path $requiredPath
                } elseif ((Get-Item $requiredPath).Length -eq 0) {
                    Add-Finding -Findings $findings -Level "WARN" -Code "empty-state-file" -Message "State file exists but is empty." -Path $requiredPath
                }
            }

            if (-not (Test-FormalStateRootShape -DirectoryPath $resolvedRoot)) {
                Add-Finding -Findings $findings -Level "ERROR" -Code "formal-root-shape-invalid" -Message "Directory does not satisfy the minimum formal state root shape." -Path $resolvedRoot
            }

            $manifestPath = Join-Path $resolvedRoot "state-manifest.json"
            if (Test-Path $manifestPath) {
                $manifest = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
                if ($manifest.task_key -ne $taskKey) {
                    Add-Finding -Findings $findings -Level "ERROR" -Code "manifest-task-mismatch" -Message "Manifest task_key does not match binding key." -Path $manifestPath
                }

                if ($manifest.formal_state_root -ne $relativeRoot) {
                    Add-Finding -Findings $findings -Level "ERROR" -Code "manifest-root-mismatch" -Message "Manifest formal_state_root does not match canonical binding." -Path $manifestPath
                }

                if ($manifest.active_mode -notin @("guard-mode", "continuity-mode")) {
                    Add-Finding -Findings $findings -Level "ERROR" -Code "invalid-active-mode" -Message "Manifest active_mode is missing or invalid." -Path $manifestPath
                }

                if ($null -eq $manifest.active_packs -or -not ($manifest.active_packs -is [System.Array])) {
                    Add-Finding -Findings $findings -Level "ERROR" -Code "invalid-active-packs" -Message "Manifest active_packs must be an array." -Path $manifestPath
                }

                if ($null -ne $manifest.last_handoff) {
                    $handoffFields = @(
                        "direction",
                        "reason",
                        "task",
                        "stage",
                        "state_basis",
                        "next_mode"
                    )

                    foreach ($field in $handoffFields) {
                        if (-not $manifest.last_handoff.PSObject.Properties[$field] -or [string]::IsNullOrWhiteSpace([string]$manifest.last_handoff.$field)) {
                            Add-Finding -Findings $findings -Level "ERROR" -Code "handoff-field-missing" -Message "Manifest last_handoff is missing a required field." -Path $manifestPath
                        }
                    }

                    if ($manifest.last_handoff.task -and $manifest.last_handoff.task -ne $taskKey) {
                        Add-Finding -Findings $findings -Level "ERROR" -Code "handoff-task-mismatch" -Message "Manifest last_handoff task does not match binding key." -Path $manifestPath
                    }

                    if ($manifest.last_handoff.next_mode -and $manifest.last_handoff.next_mode -notin @("guard-mode", "continuity-mode")) {
                        Add-Finding -Findings $findings -Level "ERROR" -Code "handoff-next-mode-invalid" -Message "Manifest last_handoff next_mode is invalid." -Path $manifestPath
                    }

                    if (
                        $manifest.last_handoff.next_mode -and
                        $manifest.active_mode -in @("guard-mode", "continuity-mode") -and
                        $manifest.last_handoff.next_mode -ne $manifest.active_mode
                    ) {
                        Add-Finding -Findings $findings -Level "WARN" -Code "handoff-active-mode-mismatch" -Message "Manifest last_handoff next_mode does not match active_mode." -Path $manifestPath
                    }
                }

                switch ($manifest.integrity_status) {
                    "ok" { }
                    "needs-normalization" {
                        Add-Finding -Findings $findings -Level "WARN" -Code "needs-normalization" -Message "Formal state root is valid but still needs normalization." -Path $manifestPath
                    }
                    "incomplete" {
                        Add-Finding -Findings $findings -Level "ERROR" -Code "manifest-incomplete" -Message "Manifest reports incomplete recovery shape." -Path $manifestPath
                    }
                    "binding-conflict" {
                        Add-Finding -Findings $findings -Level "ERROR" -Code "manifest-binding-conflict" -Message "Manifest reports a binding conflict." -Path $manifestPath
                    }
                    "shadow-copy-suspected" {
                        Add-Finding -Findings $findings -Level "WARN" -Code "manifest-shadow-copy" -Message "Manifest reports a suspected shadow copy." -Path $manifestPath
                    }
                    default {
                        Add-Finding -Findings $findings -Level "WARN" -Code "unknown-integrity-status" -Message "Manifest integrity_status is unknown." -Path $manifestPath
                    }
                }
            }

            foreach ($pattern in $derivedPatterns) {
                $matches = Get-ChildItem -Path $resolvedRoot -File -Recurse -Filter $pattern -ErrorAction SilentlyContinue
                foreach ($match in $matches) {
                    Add-Finding -Findings $findings -Level "WARN" -Code "derived-view-overreach" -Message "Derived-view-like file exists inside a formal state root." -Path $match.FullName
                }
            }
        }

        if (Test-Path $stateContainer) {
            $topLevelRoots = Get-ChildItem -Path $stateContainer -Directory
            foreach ($candidate in $topLevelRoots) {
                if (-not $resolvedRoots.ContainsKey($candidate.FullName)) {
                    Add-Finding -Findings $findings -Level "WARN" -Code "unbound-formal-root" -Message "Directory exists under .cca-state but is not referenced by canonical bindings." -Path $candidate.FullName
                }
            }
        }
    }
}

$shadowCandidates = Get-ChildItem -Path $workspaceRoot -Directory -Recurse | Where-Object {
    $full = $_.FullName
    -not (Test-IsUnderPath -Path $full -Ancestor $stateContainer) -and
    -not ($full -like "*\skills\*\state-templates*") -and
    -not ($full -like "*\.git*")
}

foreach ($candidate in $shadowCandidates) {
    if (Test-FormalStateRootShape -DirectoryPath $candidate.FullName) {
        Add-Finding -Findings $findings -Level "WARN" -Code "shadow-copy-suspected" -Message "Directory outside .cca-state has a formal-state-like shape." -Path $candidate.FullName
    }

    $manifestPath = Join-Path $candidate.FullName "state-manifest.json"
    if (Test-Path $manifestPath) {
        Add-Finding -Findings $findings -Level "WARN" -Code "shadow-manifest-suspected" -Message "state-manifest.json exists outside .cca-state." -Path $manifestPath
    }
}

$errorCount = @($findings | Where-Object { $_.level -eq "ERROR" }).Count
$warnCount = @($findings | Where-Object { $_.level -eq "WARN" }).Count

Write-Output "cca-state-check summary"
Write-Output "workspace: $workspaceRoot"
Write-Output "errors: $errorCount"
Write-Output "warnings: $warnCount"

foreach ($finding in $findings) {
    Write-Output ("[{0}] {1}: {2} :: {3}" -f $finding.level, $finding.code, $finding.message, $finding.path)
}

if ($errorCount -gt 0) {
    exit 1
}
