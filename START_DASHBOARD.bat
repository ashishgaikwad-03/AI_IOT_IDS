@echo off
title AI-IDS Dashboard
echo.
echo  ========================================
echo   AI-IDS DASHBOARD - Starting...
echo  ========================================
echo.

cd /d "%~dp0ids-python-backend"

echo [*] Starting backend on http://localhost:8000
echo [*] Press Ctrl+C to stop
echo.
start "" http://localhost:8000

python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
