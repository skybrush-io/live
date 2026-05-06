param(
  [switch] $SkipTypeCheck
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

function Invoke-Step {
  param(
    [string] $Name,
    [scriptblock] $Command
  )

  Write-Host ""
  Write-Host "==> $Name"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

if (-not (Test-Path "node_modules")) {
  Invoke-Step "Installing npm dependencies" {
    npm install
  }
}

if (-not $SkipTypeCheck) {
  Invoke-Step "Running TypeScript check" {
    npm run type:check
  }
}

Invoke-Step "Building renderer bundle" {
  npm run bundle
}

Invoke-Step "Building Electron main bundle" {
  npx webpack --mode=production --config webpack/launcher.config.js --output-path build
}

Invoke-Step "Building Electron preload bundle" {
  npx webpack --mode=production --config webpack/preload.config.js --output-path build
}

Invoke-Step "Packaging Windows installer" {
  npx --yes electron-builder --config electron-builder.json --win nsis
}

Write-Host ""
Write-Host "Windows packaging finished. Artifacts are in:"
Write-Host (Join-Path $repoRoot "dist")
