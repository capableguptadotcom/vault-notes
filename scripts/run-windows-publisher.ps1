$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $env:LOCALAPPDATA "CapableGuptaSite"
$logPath = Join-Path $logDirectory "publisher.log"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
Set-Location -LiteralPath $repoRoot

& node (Join-Path $PSScriptRoot "watch-publish-github.mjs") *>> $logPath
