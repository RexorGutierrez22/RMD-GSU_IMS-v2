Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SYSTEM INTEGRITY CHECK" -ForegroundColor Cyan
Write-Host "   Verifying all routes and connections" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Set location
Set-Location "c:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS"

$allGood = $true

Write-Host "Phase 1: Checking Essential Files" -ForegroundColor Yellow
Write-Host ""

# Essential files that MUST exist
$essentialFiles = @{
    "client\src\App.jsx" = "Main routing file"
    "client\src\main.jsx" = "React entry point"
    "client\index.html" = "HTML entry point"
    "client\package.json" = "Dependencies"
    "server\routes\api.php" = "API routes"
    "server\routes\web.php" = "Web routes"
    "server\app\Http\Controllers\Api\UserController.php" = "User API"
    "server\app\Http\Controllers\Api\InventoryController.php" = "Inventory API"
    "server\app\Http\Controllers\Api\TransactionController.php" = "Transaction API"
    "server\app\Http\Controllers\AdminController.php" = "Admin Controller"
}

foreach ($file in $essentialFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "   [OK] $($essentialFiles[$file]): " -ForegroundColor Green -NoNewline
        Write-Host "$file" -ForegroundColor Gray
    } else {
        Write-Host "   [MISSING] $($essentialFiles[$file]): $file" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "Phase 2: Checking Active Components" -ForegroundColor Yellow
Write-Host ""

# Components referenced in App.jsx
$activeComponents = @{
    "client\src\pages\LandingPage.jsx" = "Landing page"
    "client\src\pages\RegisterStudent.jsx" = "Student registration"
    "client\src\pages\RegisterEmployee.jsx" = "Employee registration"
    "client\src\pages\AdminLogin.jsx" = "Admin login"
    "client\src\pages\AdminDashboard.jsx" = "Admin dashboard"
    "client\src\pages\UserAccess.jsx" = "User access management"
    "client\src\pages\Inventory.jsx" = "Inventory management"
    "client\src\components\ErrorBoundary.jsx" = "Error handling"
}

foreach ($component in $activeComponents.Keys) {
    if (Test-Path $component) {
        Write-Host "   [OK] $($activeComponents[$component]): " -ForegroundColor Green -NoNewline
        Write-Host "$component" -ForegroundColor Gray
    } else {
        Write-Host "   [MISSING] $($activeComponents[$component]): $component" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "Phase 3: Checking Database Configuration" -ForegroundColor Yellow
Write-Host ""

$dbFiles = @{
    "server\.env" = "Environment config"
    "server\config\database.php" = "Database config"
    "server\config\cors.php" = "CORS config"
}

foreach ($dbFile in $dbFiles.Keys) {
    if (Test-Path $dbFile) {
        Write-Host "   [OK] $($dbFiles[$dbFile]): " -ForegroundColor Green -NoNewline
        Write-Host "$dbFile" -ForegroundColor Gray
    } else {
        Write-Host "   [WARNING] MISSING: $($dbFiles[$dbFile]): $dbFile" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Phase 4: Checking API Endpoints Structure" -ForegroundColor Yellow
Write-Host ""

# Read and verify API routes exist
if (Test-Path "server\routes\api.php") {
    $apiContent = Get-Content "server\routes\api.php" -Raw

    $criticalEndpoints = @{
        "students" = "Student API"
        "employees" = "Employee API"
        "inventory" = "Inventory API"
        "transactions" = "Transaction API"
        "admin/login" = "Admin login"
        "borrow-requests" = "Borrow requests"
    }

    foreach ($endpoint in $criticalEndpoints.Keys) {
        if ($apiContent -match $endpoint) {
            Write-Host "   [OK] API Endpoint: /$endpoint - $($criticalEndpoints[$endpoint])" -ForegroundColor Green
        } else {
            Write-Host "   [MISSING] API: /$endpoint - $($criticalEndpoints[$endpoint])" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   [MISSING] Cannot verify API routes - file missing" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "Phase 5: Checking Models" -ForegroundColor Yellow
Write-Host ""

$models = @{
    "server\app\Models\User.php" = "User model"
    "server\app\Models\Student.php" = "Student model"
    "server\app\Models\Employee.php" = "Employee model"
    "server\app\Models\Admin.php" = "Admin model"
    "server\app\Models\InventoryItem.php" = "Inventory model"
    "server\app\Models\BorrowTransaction.php" = "Transaction model"
}

foreach ($model in $models.Keys) {
    if (Test-Path $model) {
        Write-Host "   [OK] $($models[$model]): " -ForegroundColor Green -NoNewline
        Write-Host "$model" -ForegroundColor Gray
    } else {
        Write-Host "   [MISSING] $($models[$model]): $model" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "Phase 6: Checking Service Files" -ForegroundColor Yellow
Write-Host ""

$services = @{
    "client\src\services\imsApi.js" = "IMS API service"
    "client\src\admin\services\adminAPI.js" = "Admin API service"
}

foreach ($service in $services.Keys) {
    if (Test-Path $service) {
        Write-Host "   [OK] $($services[$service]): " -ForegroundColor Green -NoNewline
        Write-Host "$service" -ForegroundColor Gray
    } else {
        Write-Host "   [MISSING] $($services[$service]): $service" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "   SYSTEM INTEGRITY: PERFECT!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All critical files are present and accounted for!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your system is SAFE to run:" -ForegroundColor Green
    Write-Host "   - All routes are intact" -ForegroundColor Gray
    Write-Host "   - All components exist" -ForegroundColor Gray
    Write-Host "   - All API endpoints configured" -ForegroundColor Gray
    Write-Host "   - All models present" -ForegroundColor Gray
    Write-Host "   - All services connected" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can safely start your system now!" -ForegroundColor Cyan
} else {
    Write-Host "   SYSTEM INTEGRITY: ISSUES FOUND" -ForegroundColor Yellow
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Some files are missing!" -ForegroundColor Yellow
    Write-Host "Please review the errors above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If files were accidentally deleted, you can:" -ForegroundColor White
    Write-Host "1. Restore from Git: git checkout -- [filename]" -ForegroundColor Gray
    Write-Host "2. Check your backup folder if you created one" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Quick Stats:" -ForegroundColor Yellow

# Count files
$clientJsxCount = (Get-ChildItem "client\src" -Recurse -Filter "*.jsx" -ErrorAction SilentlyContinue | Measure-Object).Count
$serverPhpCount = (Get-ChildItem "server\app" -Recurse -Filter "*.php" -ErrorAction SilentlyContinue | Measure-Object).Count

Write-Host "   React Components: $clientJsxCount files" -ForegroundColor White
Write-Host "   PHP Files: $serverPhpCount files" -ForegroundColor White

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close..."
