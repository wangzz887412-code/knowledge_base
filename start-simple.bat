@echo off
cd /d "%~dp0"

echo ============================================
echo        Starting Knowledge Base...
echo ============================================
echo.

echo 1. Starting Django backend...
start "Django Backend" powershell -Command "cd '%~dp0backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

echo Waiting for backend...
timeout /t 3 /nobreak >nul

echo.
echo 2. Starting frontend...
start "Frontend" powershell -Command "cd '%~dp0frontend'; npm run dev"

echo Waiting for frontend...
timeout /t 5 /nobreak >nul

echo.
echo 3. Opening website...
start http://localhost:5174

echo.
echo ============================================
echo     Website started successfully!
echo ============================================
echo Frontend: http://localhost:5174
echo Backend: http://localhost:8000
echo ============================================
echo.
echo Press any key to close...
pause >nul
