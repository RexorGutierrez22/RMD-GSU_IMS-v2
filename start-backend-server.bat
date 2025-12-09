@echo off
REM Start Laravel Backend Server for RMD-GSU IMS

echo ===========================================
echo Starting Laravel Backend Server
echo ===========================================
echo.

REM Check if we're in the right directory
if not exist "server\artisan" (
    echo ERROR: Cannot find Laravel server directory
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if PHP is available
php --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PHP is not installed or not in PATH
    echo Please install PHP or add it to your PATH
    pause
    exit /b 1
)

echo Checking database connection...
cd server
php artisan migrate:status >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Database connection test failed!
    echo Please check your .env file database settings
    echo.
    echo Press any key to continue anyway, or Ctrl+C to cancel...
    pause >nul
)

echo.
echo Starting Laravel server on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

php artisan serve --port=8000

pause

