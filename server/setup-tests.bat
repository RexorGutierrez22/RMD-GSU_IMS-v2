@echo off
REM Test Setup Script for RMD-GSU IMS (Windows)

echo 🧪 Setting up test environment...

REM Clear caches
echo 📦 Clearing caches...
php artisan config:clear
php artisan cache:clear
php artisan route:clear

REM Run migrations for testing
echo 🗄️  Running migrations...
php artisan migrate:fresh --env=testing --force

REM Run tests
echo ✅ Running tests...
php artisan test

echo ✨ Done!
pause

