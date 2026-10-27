@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua co Node.js. Cai Node.js 22 tro len roi thu lai.
  echo https://nodejs.org/
  pause
  exit /b 1
)
start "HNL Dev Center Local Server" cmd /k "node scripts\serve.mjs"
powershell -NoProfile -Command "Start-Sleep -Seconds 2" >nul 2>nul
start "" "http://127.0.0.1:4173"
exit /b 0
