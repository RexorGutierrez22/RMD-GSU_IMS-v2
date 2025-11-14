<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ReturnVerificationController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LocationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Admin Authentication Routes
Route::post('/admin/login', [AdminController::class, 'login']);

// Super Admin Authentication Routes
Route::post('/superadmin/login', [SuperAdminController::class, 'authenticate']);

// Get all approved admin and superadmin accounts (for Admin/Staff Management tab)
Route::get('/admin', [AdminController::class, 'getApprovedAdmins']);
Route::get('/superadmin', [SuperAdminController::class, 'getApprovedSuperAdmins']);

// Admin Protected Routes
Route::middleware('auth:admin')->group(function () {
    Route::post('/admin/logout', [AdminController::class, 'logout']);
    Route::get('/admin/me', [AdminController::class, 'me']);
    Route::get('/admin/verify', [AdminController::class, 'verify']);

    // Admin Management Routes (for super admins)
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::put('/admins/{id}', [AdminController::class, 'update']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
});

// Admin Registration Routes (Public - no auth required for registration)
Route::prefix('admin-registrations')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'register']);
    Route::post('/send-otp', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'sendOTP']);

    // Super Admin only routes (add auth middleware later)
    Route::get('/pending', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'getPendingRegistrations']);
    Route::get('/history', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'getRegistrationHistory']);
    Route::post('/{id}/approve', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'approveRegistration']);
    Route::post('/{id}/reject', [\App\Http\Controllers\Api\AdminRegistrationController::class, 'rejectRegistration']);
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/admin/verify', [AuthController::class, 'verify'])->middleware('auth:sanctum');

// Dashboard routes
Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    Route::get('stats', [DashboardController::class, 'getStats']);
    Route::get('students-count', [DashboardController::class, 'getStudentsCount']);
    Route::get('employees-count', [DashboardController::class, 'getEmployeesCount']);
    Route::get('inventory-stats', [DashboardController::class, 'getInventoryStats']);
    Route::get('activity', [DashboardController::class, 'getRecentActivity']);
});

// Temporary unprotected dashboard routes for testing
Route::prefix('test-dashboard')->group(function () {
    Route::get('stats', [DashboardController::class, 'getStats']);
    Route::get('activity', [DashboardController::class, 'getRecentActivity']);
});

// Public dashboard routes (for when not authenticated)
Route::prefix('dashboard')->group(function () {
    Route::get('students-count', [DashboardController::class, 'getStudentsCount']);
    Route::get('employees-count', [DashboardController::class, 'getEmployeesCount']);
    Route::get('inventory-stats', [DashboardController::class, 'getInventoryStats']);
});

// Archive routes - protected
Route::middleware('auth:sanctum')->prefix('archive')->group(function () {
    Route::get('students', [ArchiveController::class, 'getArchivedStudents']);
    Route::get('employees', [ArchiveController::class, 'getArchivedEmployees']);
    Route::delete('students/{id}', [ArchiveController::class, 'deleteAndArchiveStudent']);
    Route::delete('employees/{id}', [ArchiveController::class, 'deleteAndArchiveEmployee']);
});

// Record management with archiving - protected
Route::middleware('auth:sanctum')->prefix('records')->group(function () {
    // TODO: Create RecordController
    // Route::delete('students/{id}', [\App\Http\Controllers\Api\RecordController::class, 'deleteStudent']);
    // Route::delete('employees/{id}', [\App\Http\Controllers\Api\RecordController::class, 'deleteEmployee']);
});

// CORS Preflight handling
Route::options('{any}', function() {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
        ->header('Access-Control-Max-Age', '86400');
})->where('any', '.*');

// Registration routes
Route::post('/employees', [EmployeeController::class, 'store']);
Route::post('/students', [StudentController::class, 'store']);
Route::get('/employees', [EmployeeController::class, 'index']);
Route::get('/students', [StudentController::class, 'index']);

// Update routes for students and employees
Route::put('/students/{id}', [StudentController::class, 'update']);
Route::put('/employees/{id}', [EmployeeController::class, 'update']);

// QR Code retrieval routes for existing users
Route::get('/students/{id}/qr-code', [StudentController::class, 'getQRCode']);
Route::get('/employees/{id}/qr-code', [EmployeeController::class, 'getQRCode']);

// Authentication routes for students and employees
Route::post('/students/authenticate', [StudentController::class, 'authenticate']);
Route::post('/employees/authenticate', [EmployeeController::class, 'authenticate']);

// Uniqueness checking routes
Route::post('/check-student-uniqueness', [StudentController::class, 'checkUniqueness']);
Route::post('/check-employee-uniqueness', [EmployeeController::class, 'checkUniqueness']);

// QR Code inline display route (for showing in modal)
Route::get('/qr-display/{type}/{filename}', function ($type, $filename) {
    $path = public_path("qr_codes/{$type}/{$filename}");

    if (!file_exists($path)) {
        return response()->json(['error' => 'QR code not found'], 404);
    }

    $fileExtension = pathinfo($filename, PATHINFO_EXTENSION);
    $mimeType = $fileExtension === 'svg' ? 'image/svg+xml' : 'image/png';

    return response()->file($path, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET',
        'Access-Control-Allow-Headers' => '*'
    ]);
})->where(['type' => 'students|employees', 'filename' => '.*']);

// QR Code download route (for downloading)
Route::get('/download-qr/{type}/{filename}', function ($type, $filename) {
    $path = public_path("qr_codes/{$type}/{$filename}");

    if (!file_exists($path)) {
        return response()->json(['error' => 'QR code not found'], 404);
    }

    $fileExtension = pathinfo($filename, PATHINFO_EXTENSION);

    // Determine mime type based on extension
    switch ($fileExtension) {
        case 'html':
            $mimeType = 'text/html';
            break;
        case 'png':
            $mimeType = 'image/png';
            break;
        case 'svg':
            $mimeType = 'image/svg+xml';
            break;
        default:
            $mimeType = 'application/octet-stream';
    }

    return response()->file($path, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET',
        'Access-Control-Allow-Headers' => '*'
    ]);
})->where(['type' => 'students|employees', 'filename' => '.*']);

// Dashboard API Routes
Route::prefix('dashboard')->group(function () {
    Route::get('/students-count', [DashboardController::class, 'getStudentsCount']);
    Route::get('/employees-count', [DashboardController::class, 'getEmployeesCount']);
    Route::get('/inventory-stats', [DashboardController::class, 'getInventoryStats']);
    Route::get('/stats', [DashboardController::class, 'getStats']);
    Route::get('/recent-activity', [DashboardController::class, 'getRecentActivity']);

    // Super Admin Authentication
    Route::post('/super-admin/authenticate', [DashboardController::class, 'authenticateSuperAdmin']);

    // User Management Routes (for Super Admin)
    Route::get('/all-students', [DashboardController::class, 'getAllStudents']);
    Route::get('/all-employees', [DashboardController::class, 'getAllEmployees']);
});

// ========================================
// NEW INVENTORY MANAGEMENT SYSTEM API ROUTES
// ========================================

// IMS API routes with versioning
Route::prefix('ims/v1')->group(function () {

    // User routes for IMS
    Route::prefix('users')->group(function () {
        Route::post('/register', [UserController::class, 'register']);
        Route::post('/qr-lookup', [UserController::class, 'getUserByQrCode']);
        Route::get('/statistics', [UserController::class, 'getStatistics']);
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::post('/{id}/qr-code', [UserController::class, 'generateQrCode']);
    });

    // Inventory routes for IMS
    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/categories', [InventoryController::class, 'getCategories']);
        Route::get('/statistics', [InventoryController::class, 'getStatistics']);
        Route::get('/low-stock', [InventoryController::class, 'getLowStockItems']);
        Route::get('/{id}', [InventoryController::class, 'show']);
        Route::post('/', [InventoryController::class, 'store']);
        Route::put('/{id}', [InventoryController::class, 'update']);
        Route::delete('/{id}', [InventoryController::class, 'destroy']);
    });

    // Categories routes for IMS
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{id}', [CategoryController::class, 'show']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{id}', [CategoryController::class, 'update']);
        Route::delete('/{id}', [CategoryController::class, 'destroy']);
    });

    // Locations routes for IMS
    Route::prefix('locations')->group(function () {
        Route::get('/', [LocationController::class, 'index']);
        Route::get('/{id}', [LocationController::class, 'show']);
        Route::post('/', [LocationController::class, 'store']);
        Route::put('/{id}', [LocationController::class, 'update']);
        Route::delete('/{id}', [LocationController::class, 'destroy']);
    });

    // Transaction routes for IMS
    Route::prefix('transactions')->group(function () {
        Route::post('/borrow', [TransactionController::class, 'createBorrow']);
        Route::get('/borrow-requests', [TransactionController::class, 'getAllBorrowRequests']);
        Route::post('/borrowed-items', [TransactionController::class, 'getBorrowedItems']);
        Route::post('/return', [TransactionController::class, 'createReturn']);
        Route::get('/history', [TransactionController::class, 'getTransactionHistory']);
        Route::get('/history/{userId}', [TransactionController::class, 'getTransactionHistory']);
        Route::get('/overdue', [TransactionController::class, 'getOverdueItems']);
        Route::get('/recent', [TransactionController::class, 'getRecentTransactions']);

        // Admin approval routes
        Route::post('/approve/{transactionId}', [TransactionController::class, 'approveBorrowRequest']);
        Route::post('/reject/{transactionId}', [TransactionController::class, 'rejectBorrowRequest']);

        // Admin action routes for borrowed items
        Route::post('/mark-returned/{transactionId}', [TransactionController::class, 'markAsReturned']);
        Route::post('/extend-return/{transactionId}', [TransactionController::class, 'extendReturnDate']);
        Route::get('/returned-items', [TransactionController::class, 'getReturnedItems']);
    });

    // Return Verification routes (NEW - Return Verification Lounge workflow)
    Route::prefix('return-verifications')->group(function () {
        // User initiates return verification
        Route::post('/create', [ReturnVerificationController::class, 'createReturnVerification']);

        // Check verification status (user polling)
        Route::post('/check-status', [ReturnVerificationController::class, 'checkVerificationStatus']);

        // Admin views pending verifications (Return Verification Lounge)
        Route::get('/pending', [ReturnVerificationController::class, 'getPendingVerifications']);

        // Admin views all verifications with filters (default route)
        Route::get('/all', [ReturnVerificationController::class, 'getAllVerifications']);
        Route::get('/', [ReturnVerificationController::class, 'getAllVerifications']); // Default to all

        // Admin verifies return (moves to Returned Items table)
        Route::post('/{verificationId}/verify', [ReturnVerificationController::class, 'verifyReturn']);

        // Admin rejects return
        Route::post('/{verificationId}/reject', [ReturnVerificationController::class, 'rejectReturn']);
    });

    // Return Inspection routes (for Returned Items table)
    Route::prefix('return-inspections')->group(function () {
        // Get all returned items pending inspection
        Route::get('/pending', [TransactionController::class, 'getPendingInspections']);

        // Inspect returned item and mark condition
        Route::post('/{returnTransactionId}/inspect', [TransactionController::class, 'inspectReturnedItem']);
    });

    // System health check for IMS
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'system' => 'RMD-GSU Inventory Management System',
            'timestamp' => now()->toISOString(),
            'version' => '1.0.0'
        ]);
    });
});
