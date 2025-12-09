@echo off
REM Laravel Scheduler Setup Script for Windows
REM This script helps set up the Windows Task Scheduler for Laravel

echo ========================================
echo Laravel Scheduler Setup
echo ========================================
echo.

REM Get the current directory (should be server directory)
set SERVER_DIR=%~dp0
set SERVER_DIR=%SERVER_DIR:~0,-1%

echo Server Directory: %SERVER_DIR%
echo.

REM Find PHP path
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PHP is not in your PATH!
    echo Please add PHP to your system PATH or provide the full path below.
    echo.
    set /p PHP_PATH="Enter full path to php.exe (e.g., C:\xampp\php\php.exe): "
) else (
    for /f "delims=" %%i in ('where php') do set PHP_PATH=%%i
    echo Found PHP at: %PHP_PATH%
)

echo.
echo ========================================
echo Creating Task Scheduler Entry
echo ========================================
echo.

REM Create the scheduled task
schtasks /create /tn "Laravel Scheduler" /tr "\"%PHP_PATH%\" artisan schedule:run" /sc minute /mo 1 /ru SYSTEM /f /rl HIGHEST /wd "%SERVER_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS!
    echo ========================================
    echo.
    echo Task Scheduler entry created successfully!
    echo.
    echo Task Name: Laravel Scheduler
    echo Runs: Every 1 minute
    echo Working Directory: %SERVER_DIR%
    echo.
    echo To verify, open Task Scheduler and look for "Laravel Scheduler"
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR!
    echo ========================================
    echo.
    echo Failed to create task. You may need to run this script as Administrator.
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
)

echo.
pause

