$ErrorActionPreference = "Stop"

Write-Host "KDOS :: Package (Windows)" -ForegroundColor Cyan

Write-Host "Step 1/2 - Building application..." -ForegroundColor Cyan

& "$PSScriptRoot\build-electron.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build step failed. Aborting packaging." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Verifying build output..." -ForegroundColor Cyan

if (-not (Test-Path "out")) {
    Write-Host "Build output directory 'out' was not found. Aborting." -ForegroundColor Red
    exit 1
}

$outputFiles = Get-ChildItem -Path "out" -Recurse -File

if ($outputFiles.Count -eq 0) {
    Write-Host "Build output directory 'out' is empty. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "Build output verified ($($outputFiles.Count) files)." -ForegroundColor Green

Write-Host "Step 2/2 - Packaging Windows installer via electron-builder..." -ForegroundColor Cyan

npx electron-builder --config electron-builder.yml --win --publish never

if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Packaging completed successfully." -ForegroundColor Green
Write-Host "Installer output: release/" -ForegroundColor DarkGray