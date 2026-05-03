@echo off
echo ===================================================
echo     AI IDS DASHBOARD - Startup Script
echo ===================================================
echo.

:: Get the current directory of this batch file
set "DIR=%~dp0"

echo [1/2] Starting Python FastAPI Backend (Port 8000)...
:: Open a new command window for the backend (run as admin for Scapy)
start "IDS Python Backend" cmd /c "cd /d "%DIR%ids-python-backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload || echo Backend failed to start && pause"

:: Wait 3 seconds to let backend start initializing
timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend (Port 5173)...
:: Open a new command window for the frontend and run Vite
start "IDS Frontend" cmd /c "cd /d "%DIR%ids-frontend" && node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev || echo Frontend failed to start && pause"

:: Wait 3 seconds to give Vite time to spin up
timeout /t 3 /nobreak >nul

echo [OK] Opening Browser to http://localhost:5173...
start http://localhost:5173

echo.
echo All services have been launched!
echo Keep the new command windows open. Closing them will stop the dashboard.
echo.
echo ───────────────────────────────────────────────────
echo  TIPS:
echo  - Run as Administrator for live packet capture
echo  - Test attack injection: curl -X POST "http://localhost:8000/api/inject-attack?attack_type=ddos"
echo  - Health check: http://localhost:8000/health
echo ───────────────────────────────────────────────────
echo.
pause
