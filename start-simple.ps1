Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       Starting Knowledge Base..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$basePath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $basePath

Write-Host "1. Starting Django backend..." -ForegroundColor Yellow
$backendScript = @"
cd '$basePath\backend'
.\venv\Scripts\Activate.ps1
python manage.py runserver
"@
Set-Content -Path "$basePath\_temp_backend.ps1" -Value $backendScript
Start-Process powershell -ArgumentList "-NoExit", "-File", "$basePath\_temp_backend.ps1"

Write-Host "Waiting for backend..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "2. Starting frontend..." -ForegroundColor Yellow
$frontendScript = @"
cd '$basePath\frontend'
npm run dev
"@
Set-Content -Path "$basePath\_temp_frontend.ps1" -Value $frontendScript
Start-Process powershell -ArgumentList "-NoExit", "-File", "$basePath\_temp_frontend.ps1"

Write-Host "Waiting for frontend..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "3. Opening website..." -ForegroundColor Yellow
Start-Process "http://localhost:5174"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "    Website started successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "Backend: http://localhost:8000" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cleaning up temp files..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Remove-Item "$basePath\_temp_*.ps1" -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Gray
Read-Host
