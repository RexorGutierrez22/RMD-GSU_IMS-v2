# Quick Fix for .env Configuration
# This script will update APP_URL to include port 8000

$envPath = "server\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found at $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "Fixing .env configuration..." -ForegroundColor Yellow

# Read the .env file
$content = Get-Content $envPath -Raw

# Fix APP_URL
$content = $content -replace "(?m)^APP_URL=.*$", "APP_URL=http://localhost:8000"

# Ensure database settings are correct (won't overwrite if already set)
if ($content -notmatch "DB_CONNECTION=") {
    $content = "DB_CONNECTION=mysql`r`n" + $content
}
if ($content -notmatch "DB_HOST=") {
    $content = $content -replace "(?m)^(DB_CONNECTION=.*)$", "`$1`r`nDB_HOST=127.0.0.1"
}
if ($content -notmatch "DB_PORT=") {
    $content = $content -replace "(?m)^(DB_HOST=.*)$", "`$1`r`nDB_PORT=3306"
}
if ($content -notmatch "DB_DATABASE=") {
    $content = $content -replace "(?m)^(DB_PORT=.*)$", "`$1`r`nDB_DATABASE=rmd_inventory"
}
if ($content -notmatch "DB_USERNAME=") {
    $content = $content -replace "(?m)^(DB_DATABASE=.*)$", "`$1`r`nDB_USERNAME=root"
}
if ($content -notmatch "DB_PASSWORD=") {
    $content = $content -replace "(?m)^(DB_USERNAME=.*)$", "`$1`r`nDB_PASSWORD="
}

# Write back to file
Set-Content -Path $envPath -Value $content -NoNewline

Write-Host "✓ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Updated settings:" -ForegroundColor Cyan
Write-Host "  APP_URL=http://localhost:8000" -ForegroundColor White
Write-Host ""

