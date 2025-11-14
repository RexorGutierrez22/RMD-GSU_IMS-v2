
Write-Host "🔄 Starting Database Restoration Process..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Change to server directory
Set-Location "c:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS\server"

Write-Host "📋 Step 1: Checking Laravel installation..." -ForegroundColor Yellow
try {
    $version = php artisan --version
    Write-Host "✅ Laravel version: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Laravel not found or PHP not in PATH" -ForegroundColor Red
    Write-Host "Please ensure PHP and Composer are installed" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 2: Recreating database structure..." -ForegroundColor Yellow
php artisan migrate:fresh --force

Write-Host "🌱 Step 3: Seeding database with sample data..." -ForegroundColor Yellow
php artisan db:seed --force

Write-Host "📦 Step 4: Adding updated inventory items..." -ForegroundColor Yellow
php artisan db:seed --class=UpdatedInventoryItemsSeeder --force

Write-Host "🔍 Step 5: Testing database..." -ForegroundColor Yellow
php artisan tinker --execute="
    echo 'Database Tables Count:' . PHP_EOL;
    try {
        echo 'Students: ' . DB::table('students')->count() . PHP_EOL;
        echo 'Employees: ' . DB::table('employees')->count() . PHP_EOL;
        echo 'Inventory Items: ' . DB::table('inventory_items')->count() . PHP_EOL;
        echo 'Admins: ' . DB::table('admin')->count() . PHP_EOL;
    } catch (Exception \$e) {
        echo 'Error: ' . \$e->getMessage() . PHP_EOL;
    }
"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Database restoration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Default Login Credentials:" -ForegroundColor Cyan
Write-Host "   Admin: Username=Rexor22, Password=rmd@admin" -ForegroundColor White
Write-Host "   Admin: Username=RMD_Staff, Password=rmd@admin" -ForegroundColor White
Write-Host "   SuperAdmin: Username=superadmin, Password=password" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Next: Start the server with:" -ForegroundColor Cyan
Write-Host "   php artisan serve --port=8000" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue..."
