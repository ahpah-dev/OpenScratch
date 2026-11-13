@echo off
setlocal
cd /d "%~dp0"

title OpenScratch Studio

where node >nul 2>&1
if errorlevel 1 (
    echo [OpenScratch] Node.js was not found in PATH.
    echo Please install Node.js ^(v18 or newer^) from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [OpenScratch] Installing dependencies for first run...
    call npm install
    if errorlevel 1 (
        echo [OpenScratch] npm install failed.
        pause
        exit /b 1
    )
)

echo [OpenScratch] Starting OpenScratch Studio and opening your browser...
call npm run dev -- --open
if errorlevel 1 (
    echo [OpenScratch] Server stopped with an error.
    pause
    exit /b 1
)
