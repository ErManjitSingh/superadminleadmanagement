$ErrorActionPreference = "Stop"

$androidDir = Join-Path $PSScriptRoot "..\android"
$keystoreDir = Join-Path $androidDir "keystore"
$keystorePath = Join-Path $keystoreDir "emb-crm-release.jks"
$propsPath = Join-Path $androidDir "keystore.properties"

function Find-Keytool {
  $cmd = Get-Command keytool -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @()
  if ($env:JAVA_HOME) {
    $candidates += Join-Path $env:JAVA_HOME "bin\keytool.exe"
  }
  $candidates += Get-ChildItem "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  $candidates += Get-ChildItem "C:\Program Files\Eclipse Adoptium\*\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  $candidates += Get-ChildItem "C:\Program Files\Microsoft\jdk-*\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  $candidates += Get-ChildItem "C:\Program Files\Java\jdk-*\bin\keytool.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  foreach ($path in $candidates) {
    if ($path -and (Test-Path $path)) { return $path }
  }
  return $null
}

$keytool = Find-Keytool
if (-not $keytool) {
  Write-Error "keytool not found. Install Android Studio (includes JDK) or JDK 17, then re-run: npm run keystore"
}

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

$password = "ExploreMyBharatCrm2026"
if (Test-Path $keystorePath) {
  Write-Output "Keystore already exists: $keystorePath"
} else {
  & $keytool -genkeypair -v `
    -keystore $keystorePath `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -alias emb-crm `
    -storepass $password `
    -keypass $password `
    -dname "CN=Explore My Bharat, OU=CRM, O=Explore My Bharat, L=Solan, ST=Himachal Pradesh, C=IN"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "keytool failed with exit code $LASTEXITCODE"
  }
  Write-Output "Created $keystorePath"
}

@"
storeFile=../keystore/emb-crm-release.jks
storePassword=$password
keyAlias=emb-crm
keyPassword=$password
"@ | Set-Content -Path $propsPath -Encoding ASCII

Write-Output "Wrote $propsPath"
Write-Output "Release APK will be signed with this keystore."
