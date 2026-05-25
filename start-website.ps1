Write-Host "============================================"
Write-Host "          Starting Knowledge Base..."
Write-Host "============================================"
Write-Host ""

$basePath = "D:\trae\knowledge_base2.0"
Set-Location $basePath

Write-Host "1. Starting PostgreSQL database..."
Start-Process -FilePath "$basePath\PostgreSQL\bin\pg_ctl.exe" -ArgumentList "start -D ""$basePath\PostgreSQL\data""" -WindowStyle Hidden

Write-Host "Waiting for database..."
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "2. Starting Django backend..."
Start-Process -FilePath "powershell" -ArgumentList "-Command ""cd '$basePath\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver""" -WindowStyle Normal

Write-Host "Waiting for backend..."
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "3. Starting frontend..."
Start-Process -FilePath "powershell" -ArgumentList "-Command ""cd '$basePath\frontend'; npm run dev""" -WindowStyle Normal

Write-Host "Waiting for frontend..."
Start-Sleep -Seconds 6

Write-Host ""
Write-Host "4. Opening website..."
Start-Process "http://localhost:5174"

Write-Host ""
Write-Host "============================================"
Write-Host "          Website started successfully!"
Write-Host "============================================"
Write-Host "Frontend: http://localhost:5174"
Write-Host "Backend: http://localhost:8000"
Write-Host "============================================"
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host