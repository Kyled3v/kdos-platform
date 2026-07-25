$ErrorActionPreference = "Stop"

Write-Host "KDOS :: Build (Electron)" -ForegroundColor Cyan
Write-Host "Compiling main, preload, and renderer via electron-vite..." -ForegroundColor Cyan

npx electron-vite build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Electron build failed. See output above." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Electron build completed successfully." -ForegroundColor Green
Write-Host "Output directory: out/" -ForegroundColor DarkGray