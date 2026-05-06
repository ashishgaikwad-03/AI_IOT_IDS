@echo off
title AI IDS Dashboard - One Click Start
color 0A
echo.
echo  ============================================
echo     AI IDS DASHBOARD - One Click Launcher
echo  ============================================
echo.
echo  [INFO] Project location:
echo  %~dp0
echo.

:: Get the directory where this batch file lives
set "DIR=%~dp0"

:: Step 1: Start Python backend
echo  [1/3] Starting FastAPI Backend (port 8000)...
start "IDS-Backend" cmd /k "cd /d "%DIR%ids-python-backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: Wait for backend to initialize
echo  Waiting for backend...
timeout /t 5 /nobreak >nul

:: Step 2: Start localtunnel for public URL
echo  [2/3] Starting Public Tunnel...
start "IDS-Tunnel" cmd /k "cd /d "%DIR%" && npx -y localtunnel --port 8000 --subdomain ashish-ids-sensor"

:: Wait for tunnel
timeout /t 5 /nobreak >nul

:: Step 3: Open browser
echo  [3/3] Opening Dashboard...
start http://localhost:8000

echo.
echo  ============================================
echo   DONE! Dashboard is live.
echo  ============================================
echo.
echo   Local:  http://localhost:8000
echo   Public: Check the "IDS-Tunnel" window for your public URL
echo.
echo   TIPS:
echo   - Run this script as ADMINISTRATOR for live packet capture
echo   - Close ALL black windows to stop the dashboard
echo   - Public URL changes each restart (check tunnel window)
echo.
pause
