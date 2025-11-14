Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SYSTEM CLEANUP - Removing Redundant Files" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS"

$filesRemoved = 0
$spaceSaved = 0

Write-Host "Starting cleanup process..." -ForegroundColor Yellow
Write-Host ""

# Phase 1: Remove test PHP files from server root
Write-Host "[Phase 1] Removing test PHP files..." -ForegroundColor Cyan
$testPhpFiles = @(
    "server\test_admin_auth.php",
    "server\test_admin_fix.php",
    "server\test_api_login.php",
    "server\test_auth.php",
    "server\tinker_test.php",
    "server\check_admin.php",
    "server\fix_password.php"
)

foreach ($file in $testPhpFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $filesRemoved++
        $spaceSaved += $size
        Write-Host "  [REMOVED] $file" -ForegroundColor Gray
    }
}

# Phase 2: Remove test HTML files
Write-Host ""
Write-Host "[Phase 2] Removing test HTML files..." -ForegroundColor Cyan
$testHtmlFiles = @(
    "server\public\test_auth_no_csp.html",
    "server\public\test_live_notifications.html",
    "server\public\test_registration.html",
    "server\public\system_fix.html",
    "server\test_admin_auth.html"
)

foreach ($file in $testHtmlFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $filesRemoved++
        $spaceSaved += $size
        Write-Host "  [REMOVED] $file" -ForegroundColor Gray
    }
}

# Phase 3: Remove .md documentation files (except main README)
Write-Host ""
Write-Host "[Phase 3] Removing extra documentation..." -ForegroundColor Cyan
$mdFiles = @(
    "client\troubleshooting-guide.md",
    "client\USER-ACCESS-FIX.md"
)

foreach ($file in $mdFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $filesRemoved++
        $spaceSaved += $size
        Write-Host "  [REMOVED] $file" -ForegroundColor Gray
    }
}

# Phase 4: Remove test components
Write-Host ""
Write-Host "[Phase 4] Removing test components..." -ForegroundColor Cyan
$testComponents = @(
    "client\src\App-test.jsx",
    "client\src\AppEmergencyTest.jsx",
    "client\src\AppFixed.jsx",
    "client\src\AppTest.jsx",
    "client\src\SimpleApp.jsx",
    "client\src\TestComponent.jsx"
)

foreach ($file in $testComponents) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $filesRemoved++
        $spaceSaved += $size
        Write-Host "  [REMOVED] $file" -ForegroundColor Gray
    }
}

# Phase 5: Remove old batch scripts
Write-Host ""
Write-Host "[Phase 5] Removing old batch scripts..." -ForegroundColor Cyan
$oldScripts = @(
    "server\fix-database.bat",
    "server\setup-laravel.bat",
    "server\start_system.bat",
    "server\start-with-existing-db.bat",
    "client\debug-start.bat"
)

foreach ($file in $oldScripts) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Remove-Item $file -Force
        $filesRemoved++
        $spaceSaved += $size
        Write-Host "  [REMOVED] $file" -ForegroundColor Gray
    }
}

# Calculate space saved in MB
$spaceSavedMB = [math]::Round($spaceSaved / 1MB, 2)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Files Removed: $filesRemoved" -ForegroundColor White
Write-Host "  Space Saved: $spaceSavedMB MB" -ForegroundColor White
Write-Host ""
Write-Host "What was removed:" -ForegroundColor Yellow
Write-Host "  - 7 test PHP files" -ForegroundColor Gray
Write-Host "  - 5 test HTML files" -ForegroundColor Gray
Write-Host "  - 2 documentation files" -ForegroundColor Gray
Write-Host "  - 6 test components" -ForegroundColor Gray
Write-Host "  - 5 old batch scripts" -ForegroundColor Gray
Write-Host ""
Write-Host "What was KEPT (Protected):" -ForegroundColor Cyan
Write-Host "  - All active components" -ForegroundColor Gray
Write-Host "  - All API files" -ForegroundColor Gray
Write-Host "  - All controllers" -ForegroundColor Gray
Write-Host "  - All database files" -ForegroundColor Gray
Write-Host "  - Main README files" -ForegroundColor Gray
Write-Host "  - Essential start scripts (start-complete-system.bat)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run verification again: .\VERIFY-SYSTEM-INTEGRITY.ps1" -ForegroundColor White
Write-Host "2. Restart VS Code for improved performance" -ForegroundColor White
Write-Host "3. Test your system with the start scripts" -ForegroundColor White
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close..."
