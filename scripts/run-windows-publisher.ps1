$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $env:LOCALAPPDATA "CapableGuptaSite"
$logPath = Join-Path $logDirectory "publisher.log"

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
Set-Location -LiteralPath $repoRoot

while ($true) {
  Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Starting Obsidian publisher watcher."
  & node (Join-Path $PSScriptRoot "watch-publish-github.mjs") *>> $logPath
  Add-Content -Path $logPath -Value "[$(Get-Date -Format o)] Publisher watcher exited with code $LASTEXITCODE; restarting in 10 seconds."
  Start-Sleep -Seconds 10
}
