# Backend deploy — push-token API ke liye VPS par code pull + restart
# Usage:
#   $env:VPS_PASSWORD='your-vps-password'
#   node deploy/deploy-backend-only.mjs

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

if (-not $env:VPS_PASSWORD) {
  Write-Error @"
VPS_PASSWORD set nahi hai.

PowerShell mein ye chalayein:
  `$env:VPS_PASSWORD='your-password'
  node deploy/deploy-backend-only.mjs

Ye backend par latest code pull karega aur pm2 restart karega.
Push notifications ke liye ye zaroori hai (POST /api/auth/push-token).
"@
}

Write-Output "Deploying backend to VPS..."
node deploy/deploy-backend-only.mjs
