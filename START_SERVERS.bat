@echo off
REM Start both Frontend (Vite) and Backend (Next.js) dev servers

echo ========================================
echo BMDC Development Server Startup
echo ========================================
echo.
echo Backend will run on: http://localhost:3003
echo Frontend will run on: http://localhost:3001
echo.
echo Starting Backend (Next.js) on port 3003...
cd /D "%~dp0Backend"
start "BMDC Backend - Port 3003" cmd /k "npm run dev"

timeout /t 3 /nobreak

echo.
echo Starting Frontend (Vite) on port 3001...
cd /D "%~dp0Frontend"
start "BMDC Frontend - Port 3001" cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers started!
echo ========================================
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:3003
echo API:      http://localhost:3003/api
echo ========================================
echo.
pause
