#Requires -Version 5.1
<#
.SYNOPSIS
  Crea commits con git.exe commit-tree (evita el wrapper de Cursor y trailers Co-authored-by).
.EXAMPLE
  .\scripts\commit-clean.ps1 "feat: mi cambio"
.EXAMPLE
  .\scripts\commit-clean.ps1 "feat: VRChat Udon MCP server"  # primer commit (sin padre)
#>
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message,
  [string]$Parent = ""
)

$ErrorActionPreference = "Stop"
$Git = if ($env:GIT_EXE) { $env:GIT_EXE } else { "C:\Program Files\Git\cmd\git.exe" }

if (-not (Test-Path -LiteralPath $Git)) {
  throw "No se encontró git.exe en '$Git'. Define GIT_EXE con la ruta a Git for Windows."
}

$env:GIT_AUTHOR_NAME = if ($env:GIT_AUTHOR_NAME) { $env:GIT_AUTHOR_NAME } else { "MauDevVR" }
$env:GIT_AUTHOR_EMAIL = if ($env:GIT_AUTHOR_EMAIL) { $env:GIT_AUTHOR_EMAIL } else { "MauDevVR@users.noreply.github.com" }
$env:GIT_COMMITTER_NAME = if ($env:GIT_COMMITTER_NAME) { $env:GIT_COMMITTER_NAME } else { $env:GIT_AUTHOR_NAME }
$env:GIT_COMMITTER_EMAIL = if ($env:GIT_COMMITTER_EMAIL) { $env:GIT_COMMITTER_EMAIL } else { $env:GIT_AUTHOR_EMAIL }

& $Git add -A
$tree = (& $Git write-tree | Out-String).Trim()
if (-not $tree) { throw "git write-tree falló" }

if ($Parent) {
  $newCommit = (& $Git commit-tree $tree -p $Parent -m $Message | Out-String).Trim()
} else {
  $newCommit = (& $Git commit-tree $tree -m $Message | Out-String).Trim()
}

if (-not $newCommit) { throw "git commit-tree falló" }

$branch = & $Git symbolic-ref --short HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $branch) {
  & $Git update-ref "refs/heads/$branch" $newCommit
} else {
  & $Git update-ref HEAD $newCommit
}

Write-Host "Commit: $newCommit"
& $Git log --format=fuller -1 $newCommit
