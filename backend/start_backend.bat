@echo off
title DataDose AI Graph Engine
color 0A

:: 1. Force the script to run in the folder where the .bat file is located
cd /d "%~dp0"
echo [SYSTEM] Starting DataDose AI Graph Engine...

:: 2. Smart Search for the Virtual Environment
if exist "venv\Scripts\activate.bat" (
    echo [SYSTEM] Found 'venv' in the current folder. Activating...
    call venv\Scripts\activate
) else if exist "..\venv\Scripts\activate.bat" (
    echo [SYSTEM] Found 'venv' in the parent folder. Activating...
    call ..\venv\Scripts\activate
) else if exist "env\Scripts\activate.bat" (
    echo [SYSTEM] Found 'env' in the current folder. Activating...
    call env\Scripts\activate
) else (
    echo [ERROR] Virtual environment not found! 
    echo Please make sure you have created it (python -m venv venv)
    echo and installed the requirements.
    pause
    exit /b
)

:: 3. Start the Server
echo [SYSTEM] Booting Uvicorn Server...
python -m uvicorn main:app --reload --port 8000

:: Keep the window open if the server crashes
pause