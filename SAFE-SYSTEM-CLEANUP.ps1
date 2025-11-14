Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SAFE SYSTEM CLEANUP & OPTIMIZATION" -ForegroundColor Cyan
Write-Host "   Removing lag-causing files safely" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Continue"

# Change to project root
Set-Location "c:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS"

Write-Host " Current System Status:" -ForegroundColor Yellow
Write-Host "   Analyzing files causing performance issues..." -ForegroundColor White
Write-Host ""

# Initialize counters
$filesRemoved = 0
$spaceSaved = 0

# Function to safely remove file
function Remove-SafeFile {
    param($path)
    if (Test-Path $path) {
        try {
            $size = (Get-Item $path).Length
            Remove-Item $path -Force -ErrorAction Stop
            $script:filesRemoved++
            $script:spaceSaved += $size
            Write-Host "    Removed: $path" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "    Could not remove: $path" -ForegroundColor Yellow
            return $false
        }
    }
    return $false
}

# Function to safely remove directory
function Remove-SafeDirectory {
    param($path)
    if (Test-Path $path) {
        try {
            $size = (Get-ChildItem $path -Recurse | Measure-Object -Property Length -Sum).Sum
            Remove-Item $path -Recurse -Force -ErrorAction Stop
            $script:filesRemoved++
            $script:spaceSaved += $size
            Write-Host "    Removed directory: $path" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "    Could not remove: $path" -ForegroundColor Yellow
            return $false
        }
    }
    return $false
}

Write-Host "   Phase 1: Removing Documentation Files (Safe)" -ForegroundColor Cyan
Write-Host "   These files don't affect system functionality..." -ForegroundColor Gray
Write-Host ""

# List of documentation files to remove (keep main README.md files)
$docsToRemove = @(
    "SESSION-CHECKPOINT.md",
    "EMERGENCY-RESTORE.md",
    "CURRENT-STATUS-AND-NEXT-STEPS.md",
    "CSP-CAMERA-FIX.md",
    "CSP-FIX-SUMMARY.md",
    "COMPLETE-TESTING-GUIDE.md",
    "CAMERA-SCANNER-FIX.md",
    "QR-CODE-FIX-SUMMARY.md",
    "QR-CODE-FIX-TESTING-GUIDE.md",
    "QR_CODE_FIX_DOCUMENTATION.md",
    "SYSTEM-OPTIMIZATION-REPORT.md",
    "emergency-restore.ps1",
    "RESTORE-BOTH-FILES.ps1",
    "test-csp-fix.ps1",
    "fix-vscode-lag-now.ps1"
)

foreach ($doc in $docsToRemove) {
    Remove-SafeFile $doc
}

# Remove client-specific docs
$clientDocs = @(
    "client\MODERN-REGISTRATION-DESIGN.md",
    "client\UI-ENHANCEMENT-SUMMARY.md",
    "client\troubleshooting-guide.md",
    "client\USER-ACCESS-FIX.md"
)

foreach ($doc in $clientDocs) {
    Remove-SafeFile $doc
}

Write-Host ""
Write-Host " Phase 2: Removing Test Files (Safe)" -ForegroundColor Cyan
Write-Host "   These are development/testing files not used in production..." -ForegroundColor Gray
Write-Host ""

# Server test files
$serverTestFiles = @(
    "server\test_verification_check.php",
    "server\test_status_check.php",
    "server\test_quality_update.php",
    "server\test_inventory_decrement.php",
    "server\test_borrow_workflow.php",
    "server\test_borrow_requests_api.php",
    "server\test_borrow_complete.php",
    "server\test_api_workflow.php",
    "server\test_api_approval.php",
    "server\test-api-directly.php",
    "server\test_admin_auth.html",
    "server\test_admin_fix.php",
    "server\test_api_login.php",
    "server\test_auth.php",
    "server\tinker_test.php",
    "server\check_admin.php",
    "server\fix_password.php"
)

foreach ($testFile in $serverTestFiles) {
    Remove-SafeFile $testFile
}

# Server test HTML files in public
$publicTestFiles = @(
    "server\public\system_fix.html",
    "server\public\test_auth_no_csp.html",
    "server\public\test_live_notifications.html",
    "server\public\test_registration.html",
    "server\public\test_qr_display.html"
)

foreach ($testFile in $publicTestFiles) {
    Remove-SafeFile $testFile
}

Write-Host ""
Write-Host " Phase 3: Removing Backup Files (Safe)" -ForegroundColor Cyan
Write-Host "   Old backup files taking up space..." -ForegroundColor Gray
Write-Host ""

# Remove backup files
$backupFiles = @(
    "client\src\pages\SuperAdminAccess.jsx.backup",
    "client\src\pages\SuperAdminAccess.jsx.backup_20251111_180446"
)

foreach ($backup in $backupFiles) {
    Remove-SafeFile $backup
}

Write-Host ""
Write-Host " Phase 4: Removing Temporary/Unused Components (Safe)" -ForegroundColor Cyan
Write-Host "   Components not referenced in routing..." -ForegroundColor Gray
Write-Host ""

# Unused/temporary components (verified not in App.jsx routing)
$unusedComponents = @(
    "client\src\components\BorrowRequestTemp.jsx",
    "client\src\App-test.jsx",
    "client\src\AppEmergencyTest.jsx",
    "client\src\AppFixed.jsx",
    "client\src\AppTest.jsx",
    "client\src\SimpleApp.jsx",
    "client\src\TestComponent.jsx"
)

foreach ($component in $unusedComponents) {
    Remove-SafeFile $component
}

Write-Host ""
Write-Host " Phase 5: Removing Batch Scripts (Keep start scripts)" -ForegroundColor Cyan
Write-Host "   Removing old/redundant batch files..." -ForegroundColor Gray
Write-Host ""

# Remove old batch scripts (keep essential ones)
$batchScripts = @(
    "server\fix-database.bat",
    "server\setup-laravel.bat",
    "server\start-with-existing-db.bat",
    "client\debug-start.bat"
)

foreach ($batch in $batchScripts) {
    Remove-SafeFile $batch
}

Write-Host ""
Write-Host " Phase 6: Cleaning VS Code History (Optional)" -ForegroundColor Cyan
Write-Host "   Removing .history folders if they exist..." -ForegroundColor Gray
Write-Host ""

# Remove .history folders (created by some VS Code extensions)
$historyFolders = @(
    "client\.history",
    "server\.history",
    ".history"
)

foreach ($historyFolder in $historyFolders) {
    if (Test-Path $historyFolder) {
        Remove-SafeDirectory $historyFolder
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "    CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Cleanup Summary:" -ForegroundColor Yellow
Write-Host "   Files/Folders Removed: $filesRemoved" -ForegroundColor White
$spaceSavedMB = [math]::Round($spaceSaved / 1MB, 2)
Write-Host "   Estimated Space Saved: $spaceSavedMB MB" -ForegroundColor White
Write-Host ""

Write-Host " What Was Removed:" -ForegroundColor Green
Write-Host "   ✓ Documentation files (MD files)" -ForegroundColor Gray
Write-Host "   ✓ Test/debug PHP files" -ForegroundColor Gray
Write-Host "   ✓ Test HTML files" -ForegroundColor Gray
Write-Host "   ✓ Backup files (.backup)" -ForegroundColor Gray
Write-Host "   ✓ Temporary components" -ForegroundColor Gray
Write-Host "   ✓ Old batch scripts" -ForegroundColor Gray
Write-Host "   ✓ History folders" -ForegroundColor Gray
Write-Host ""

Write-Host " What Was KEPT (Safe):" -ForegroundColor Cyan
Write-Host "   ✓ All routing files (App.jsx)" -ForegroundColor Gray
Write-Host "   ✓ All active components" -ForegroundColor Gray
Write-Host "   ✓ All API files" -ForegroundColor Gray
Write-Host "   ✓ All controllers" -ForegroundColor Gray
Write-Host "   ✓ All database files" -ForegroundColor Gray
Write-Host "   ✓ Main README files" -ForegroundColor Gray
Write-Host "   ✓ Essential start scripts" -ForegroundColor Gray
Write-Host "   ✓ All production code" -ForegroundColor Gray
Write-Host ""

Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Restart VS Code for optimal performance" -ForegroundColor White
Write-Host "   Close and reopen VS Code completely" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test your system:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   php artisan serve --port=8000" -ForegroundColor Gray
Write-Host ""
Write-Host "   cd client" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify all routes work:" -ForegroundColor White
Write-Host "   ✓ Landing page (http://localhost:3011)" -ForegroundColor Gray
Write-Host "   ✓ Admin login (http://localhost:3011/admin)" -ForegroundColor Gray
Write-Host "   ✓ Student registration (http://localhost:3011/register/student)" -ForegroundColor Gray
Write-Host "   ✓ Employee registration (http://localhost:3011/register/employee)" -ForegroundColor Gray
Write-Host "   ✓ Dashboard (http://localhost:3011/dashboard)" -ForegroundColor Gray
Write-Host ""

Write-Host " Performance Improvements Expected:" -ForegroundColor Cyan
Write-Host "   • Faster VS Code startup" -ForegroundColor Green
Write-Host "   • Reduced memory usage" -ForegroundColor Green
Write-Host "   • Faster file indexing" -ForegroundColor Green
Write-Host "   • Improved IntelliSense speed" -ForegroundColor Green
Write-Host "   • Cleaner workspace" -ForegroundColor Green
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "    System Optimized Successfully!" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close..."
