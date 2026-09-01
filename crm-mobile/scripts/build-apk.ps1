$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent $PSScriptRoot
Set-Location $appDir

Write-Output "LeadMang CRM — EAS Android APK build"
Write-Output ""
Write-Output "Prerequisites:"
Write-Output "  1. npm install -g eas-cli"
Write-Output "  2. eas login"
Write-Output "  3. eas init   (first time only — links Expo project)"
Write-Output ""

if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
  Write-Output "Installing eas-cli globally..."
  npm install -g eas-cli
}

$profile = if ($args.Count -gt 0) { $args[0] } else { "preview" }
Write-Output "Starting EAS build (profile: $profile)..."
eas build --platform android --profile $profile --non-interactive

Write-Output ""
Write-Output "When the build finishes, download the APK from the Expo dashboard link above."
