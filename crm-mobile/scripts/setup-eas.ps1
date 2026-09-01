$ErrorActionPreference = "Stop"
$appDir = Split-Path -Parent $PSScriptRoot
Set-Location $appDir

Write-Output "=== LeadMang CRM — EAS Setup ==="
Write-Output ""

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
  Write-Output "Installing eas-cli..."
  npm install -g eas-cli
}

$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Output "Expo login required. Browser khulega — apna Expo account se login karein."
  Write-Output "(Account nahi hai? https://expo.dev/signup par free bana lein)"
  Write-Output ""
  eas login
}

Write-Output ""
Write-Output "Linking Expo project (projectId app.json mein save hoga)..."
eas init --force

Write-Output ""
Write-Output "Starting cloud APK build (preview profile)..."
Write-Output "API URL: https://crm.exploremybharat.info/api"
Write-Output ""
eas build --platform android --profile preview

Write-Output ""
Write-Output "Build queue mein hai. Expo dashboard par APK download link milega."
