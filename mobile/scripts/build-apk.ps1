$ErrorActionPreference = "Stop"

$mobileDir = Split-Path -Parent $PSScriptRoot
Set-Location $mobileDir

function Find-Sdk {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) { return $env:ANDROID_SDK_ROOT }
  $default = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $default) { return $default }
  return $null
}

$sdk = Find-Sdk
if (-not $sdk) {
  Write-Error @"
Android SDK not found.
1. Install Android Studio: https://developer.android.com/studio
2. Open Studio once so it installs Android SDK + JDK
3. Re-run: npm run apk
"@
}

$localProps = Join-Path $mobileDir "android\local.properties"
$sdkPosix = ($sdk -replace '\\', '/').TrimEnd('/')
"sdk.dir=$sdkPosix" | Set-Content -Path $localProps -Encoding ASCII
Write-Output "Wrote $localProps"

$keystoreScript = Join-Path $PSScriptRoot "create-keystore.ps1"
try {
  & $keystoreScript
} catch {
  Write-Warning $_.Exception.Message
  Write-Warning "Building with Android debug signing (OK for WhatsApp install)."
}

npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location (Join-Path $mobileDir "android")
.\gradlew.bat assembleRelease
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apk = Join-Path $mobileDir "dist\ExploreMyBharat-CRM.apk"
if (Test-Path $apk) {
  Write-Output ""
  Write-Output "APK ready: $apk"
  Write-Output "Share on WhatsApp. Recipients must allow Install unknown apps."
} else {
  Write-Warning "Build finished but APK was not copied to dist/."
}
