$ErrorActionPreference = "Stop"

$sdkRoot = "C:\Android\Sdk"
$cmdlineDir = Join-Path $sdkRoot "cmdline-tools\latest"
$zipPath = Join-Path $env:TEMP "android-cmdline-tools.zip"
$extractRoot = Join-Path $env:TEMP "android-cmdline-tools-extract"
$javaHome = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"

if (-not (Test-Path $javaHome)) {
  $found = Get-ChildItem "C:\Program Files\Microsoft" -Filter "jdk-*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $javaHome = $found.FullName } else { throw "JDK not found. Install Microsoft OpenJDK 17." }
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$javaHome\bin;$cmdlineDir\bin;$sdkRoot\platform-tools;$env:Path"

Write-Output "JAVA_HOME=$env:JAVA_HOME"
Write-Output "=== Android SDK setup for APK build ==="

New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null

if (-not (Test-Path (Join-Path $cmdlineDir "bin\sdkmanager.bat"))) {
  if (-not (Test-Path $zipPath)) {
    Write-Output "Downloading Android command line tools..."
    curl.exe -L --retry 5 --retry-delay 3 -o $zipPath "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
  }
  if (Test-Path $extractRoot) { Remove-Item -Recurse -Force $extractRoot }
  New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null
  Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force
  New-Item -ItemType Directory -Force -Path (Split-Path $cmdlineDir) | Out-Null
  if (Test-Path $cmdlineDir) { Remove-Item -Recurse -Force $cmdlineDir }
  New-Item -ItemType Directory -Force -Path $cmdlineDir | Out-Null
  Copy-Item -Path (Join-Path $extractRoot "cmdline-tools\*") -Destination $cmdlineDir -Recurse -Force
}

$sdkmanager = Join-Path $cmdlineDir "bin\sdkmanager.bat"
Write-Output "Installing SDK packages..."
$yes = ("y`n" * 20)
$yes | & $sdkmanager --sdk_root="$sdkRoot" "platform-tools" "platforms;android-35" "build-tools;35.0.0"

$appDir = Split-Path -Parent $PSScriptRoot
Set-Location $appDir

if (-not (Test-Path (Join-Path $appDir "android"))) {
  Write-Output "Running expo prebuild..."
  npx expo prebuild --platform android --no-install
}

$localProps = Join-Path $appDir "android\local.properties"
"sdk.dir=$($sdkRoot -replace '\\','/')" | Set-Content -Path $localProps -Encoding ASCII

Write-Output "Building slim APK (arm64-v8a only)..."
Set-Location (Join-Path $appDir "android")
.\gradlew.bat assembleDebug --no-daemon "-PreactNativeArchitectures=arm64-v8a"

$apkSrc = Join-Path $appDir "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkSrc)) { throw "APK not found at $apkSrc" }

$distDir = Join-Path $appDir "dist"
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
$apkDest = Join-Path $distDir "LeadMang-CRM.apk"
Copy-Item $apkSrc $apkDest -Force

$desk = Join-Path $env:USERPROFILE "Desktop\LeadMang-CRM.apk"
Copy-Item $apkDest $desk -Force

Write-Output ""
Write-Output "APK READY: $apkDest"
Write-Output "Desktop:  $desk"
Write-Output "Size: $([math]::Round((Get-Item $apkDest).Length / 1MB, 2)) MB"
