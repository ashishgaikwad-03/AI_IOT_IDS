@echo off
echo ========================================================
echo        STARTING AI GUARDIAN ONLINE DEPLOYMENT
echo ========================================================

:: Change to the backend directory
cd /d "%~dp0\ids-python-backend"

:: Start the FastAPI backend in a separate window
echo [1] Starting FastAPI Backend on port 8000...
start "AI Guardian Backend" cmd /c "uvicorn main:app --host 0.0.0.0 --port 8000"

:: Wait for a couple of seconds to let the server start
timeout /t 3 /nobreak >nul

:: Use localtunnel to expose the dashboard
echo [2] Exposing Dashboard to the public internet using localtunnel...
echo Ensure you have localtunnel installed globally: npm install -g localtunnel
echo.
echo Your public URL will appear below:
npx localtunnel --port 8000 --subdomain esp32-ai-guardian

pause
