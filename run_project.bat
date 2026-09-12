@echo off
title SETU - Railway Possession Planning System Launcher
echo =====================================================================
echo           SETU: Railway Maintenance & Convoy Planning System
echo =====================================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "SETU Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "SETU Frontend (Vite)" cmd /k "npm --prefix frontend run dev"

echo.
echo =====================================================================
echo  Both servers launched in separate windows!
echo  Open your browser at: http://localhost:5173
echo =====================================================================
pause
