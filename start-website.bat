@echo off
cd /d "D:\trae\knowledge_base2.0"

echo Starting PostgreSQL...
start "PostgreSQL" /min "D:\trae\knowledge_base2.0\PostgreSQL\bin\pg_ctl.exe" start -D "D:\trae\knowledge_base2.0\PostgreSQL\data"

timeout /t 3 /nobreak >nul

echo Starting Django backend...
start "Django" "powershell" -Command "cd 'D:\trae\knowledge_base2.0\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

timeout /t 4 /nobreak >nul

echo Starting frontend...
start "Frontend" "powershell" -Command "cd 'D:\trae\knowledge_base2.0\frontend'; npm run dev"

timeout /t 6 /nobreak >nul

echo Opening website...
start http://localhost:5174

echo Website started successfully!
echo Frontend: http://localhost:5174
echo Backend: http://localhost:8000
echo.
echo Press any key to close...
pause >nul