<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\BorrowTransaction;
use App\Helpers\UserHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Get user by QR code - searches students, employees, and users tables
     */
    public function getUserByQrCode(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'qr_code' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('🔍 getUserByQrCode called', ['qr_code' => $request->qr_code]);

            // Use UserHelper to find user across all tables (students → employees → users)
            $result = UserHelper::findUserByQrCode($request->qr_code);

            if (!$result) {
                Log::warning('❌ User not found in any table', ['qr_code' => $request->qr_code]);
                return response()->json([
                    'success' => false,
                    'message' => 'User not found. Please ensure you are registered in the system.'
                ], 404);
            }

            $user = $result['user'];
            $userType = $result['type'];

            Log::info('✅ User found', [
                'user_id' => $user->id,
                'user_type' => $userType,
                'id_number' => $result['id_number']
            ]);

            // Check if user is active
            if (!UserHelper::isUserActive($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account is not active. Please contact the administrator.'
                ], 403);
            }

            // Get user's active borrows using the new multi-table approach
            $activeBorrows = BorrowTransaction::where('borrower_type', $userType)
                ->where('borrower_id', $user->id)
                ->where('status', 'borrowed')
                ->count();

            // Format user data
            $userData = UserHelper::formatUserData($user, $userType);
            $userData['active_borrows'] = $activeBorrows;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error in getUserByQrCode', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Register new user
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'type' => 'required|in:student,employee,faculty,visitor',
            'id_number' => 'required|string|max:50|unique:users',
            'email' => 'required|email|max:255|unique:users',
            'contact_number' => 'required|string|max:20',
            'department' => 'required|string|max:255',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate unique QR code
            $qrCode = $this->generateUniqueQrCode();

            // Create user
            $user = User::create(array_merge($request->all(), [
                'qr_code' => $qrCode,
                'status' => 'active'
            ]));

            // Generate QR code image
            $qrCodeImage = $this->generateQrCodeImage($qrCode, $user->full_name);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $user,
                    'qr_code_image' => $qrCodeImage
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::query();

            // Type filter
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Department filter
            if ($request->has('department')) {
                $query->where('department', $request->department);
            }

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%")
                      ->orWhere('id_number', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            $users = $query->orderBy('last_name')
                          ->orderBy('first_name')
                          ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user details
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Get user's transaction history
            $borrowHistory = BorrowTransaction::where('user_id', $id)
                ->with(['inventoryItem', 'returnTransaction'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            // Get current borrows
            $currentBorrows = BorrowTransaction::where('user_id', $id)
                ->where('status', 'borrowed')
                ->with('inventoryItem')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'current_borrows' => $currentBorrows,
                    'recent_history' => $borrowHistory
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:student,employee,faculty,visitor',
            'id_number' => 'sometimes|required|string|max:50|unique:users,id_number,' . $id,
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'contact_number' => 'sometimes|required|string|max:20',
            'department' => 'sometimes|required|string|max:255',
            'course' => 'nullable|string|max:255',
            'year_level' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:20',
            'status' => 'sometimes|required|in:active,inactive,suspended'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Check if user has active borrows
            $activeBorrows = BorrowTransaction::where('user_id', $id)
                ->where('status', 'borrowed')
                ->count();

            if ($activeBorrows > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete user with active borrows'
                ], 400);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'inactive_users' => User::where('status', 'inactive')->count(),
                'suspended_users' => User::where('status', 'suspended')->count(),
                'user_types' => User::select('type')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('type')
                    ->orderBy('count', 'desc')
                    ->get()
                    ->pluck('count', 'type'),
                'departments' => User::select('department')
                    ->selectRaw('COUNT(*) as count')
                    ->groupBy('department')
                    ->orderBy('count', 'desc')
                    ->get()
                    ->pluck('count', 'department'),
                'users_with_active_borrows' => User::whereHas('borrowTransactions', function($query) {
                    $query->where('status', 'borrowed');
                })->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate QR code for user
     */
    public function generateQrCode(int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            if (empty($user->qr_code)) {
                $user->qr_code = $this->generateUniqueQrCode();
                $user->save();
            }

            $qrCodeImage = $this->generateQrCodeImage($user->qr_code, $user->full_name);

            return response()->json([
                'success' => true,
                'data' => [
                    'qr_code' => $user->qr_code,
                    'qr_code_image' => $qrCodeImage
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique QR code
     */
    private function generateUniqueQrCode(): string
    {
        do {
            $qrCode = 'RMD-GSU-' . strtoupper(Str::random(8));
        } while (User::where('qr_code', $qrCode)->exists());

        return $qrCode;
    }

    /**
     * Generate QR code image
     */
    private function generateQrCodeImage(string $qrCode, string $userName): string
    {
        try {
            // Generate QR code as base64 image
            $qrCodeSvg = QrCode::size(200)
                ->format('png')
                ->generate($qrCode);

            // Convert to base64
            $qrCodeBase64 = base64_encode($qrCodeSvg);

            return 'data:image/png;base64,' . $qrCodeBase64;

        } catch (\Exception $e) {
            return '';
        }
    }
}
