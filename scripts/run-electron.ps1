$ErrorActionPreference = "Stop"

Write-Host "KDOS :: Development Launch" -ForegroundColor Cyan
Write-Host "Environment: development" -ForegroundColor DarkGray

$env:NODE_ENV = "development"

Write-Host "Starting electron-vite in development mode..." -ForegroundColor Cyan

npx electron-vite dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "KDOS exited with an error." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "KDOS session ended." -ForegroundColor Green