<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Admin;
use App\Models\AdminRegistration;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Admin login
     */
    public function login(Request $request)
    {
        try {
            // Reduced logging - only log in development or for failed attempts
            if (config('app.debug')) {
                Log::info('Admin login attempt', [
                    'username' => $request->username ?? 'not provided',
                ]);
            }

            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            $admin = null;
            $superAdmin = null;
            $role = 'staff';
            $userData = null;
            // Trim whitespace and handle case sensitivity
            $username = trim($request->username);
            $password = $request->password;

            // Optimized: Use separate queries with indexes instead of orWhere
            // This allows database to use indexes efficiently
            $admin = Admin::where('username', $username)->first();
            if (!$admin) {
                $admin = Admin::where('email', $username)->first();
            }

            if ($admin) {
                // Found in admin table - verify password
                $isPasswordHashed = strpos($admin->password, '$2y$') === 0 || strpos($admin->password, '$2a$') === 0;

                // If password is not hashed, hash it now and update the database
                if (!$isPasswordHashed) {
                    if (config('app.debug')) {
                        Log::warning('Admin password is not hashed, hashing now', [
                            'admin_id' => $admin->id,
                            'username' => $admin->username
                        ]);
                    }
                    $admin->password = Hash::make($admin->password);
                    $admin->save();
                }

                if (!Hash::check($password, $admin->password)) {
                    throw ValidationException::withMessages([
                        'username' => ['The provided credentials are incorrect.'],
                    ]);
                }

                // Optimized: Check superadmin table only if needed, using indexed queries
                $superAdmin = \App\Models\SuperAdmin::where('username', $admin->username)->first();
                if (!$superAdmin) {
                    $superAdmin = \App\Models\SuperAdmin::where('email', $admin->email)->first();
                }

                $role = $superAdmin ? 'admin' : 'staff';
                // Defer Storage URL generation - only generate if profile_image exists
                $profileImageUrl = null;
                if ($admin->profile_image) {
                    $profileImageUrl = url(\Storage::url($admin->profile_image));
                }

                $userData = [
                    'id' => $admin->id,
                    'full_name' => $admin->full_name,
                    'email' => $admin->email,
                    'username' => $admin->username,
                    'profile_image' => $profileImageUrl,
                    'role' => $role,
                ];
            } else {
                // Not found in admin table, try superadmin table
                $superAdmin = \App\Models\SuperAdmin::where('username', $username)->first();
                if (!$superAdmin) {
                    $superAdmin = \App\Models\SuperAdmin::where('email', $username)->first();
                }

                if ($superAdmin) {
                    // Found in superadmin table - verify password
                    $isPasswordHashed = strpos($superAdmin->password, '$2y$') === 0 ||
                                       strpos($superAdmin->password, '$2a$') === 0 ||
                                       strpos($superAdmin->password, '$2b$') === 0;

                    if (!$isPasswordHashed) {
                        // Plain text password - compare directly
                        if ($superAdmin->password !== $password) {
                            if (config('app.debug')) {
                                Log::warning('SuperAdmin password mismatch (plain text)', [
                                    'username' => $superAdmin->username,
                                    'expected_length' => strlen($superAdmin->password),
                                    'provided_length' => strlen($password)
                                ]);
                            }
                            throw ValidationException::withMessages([
                                'username' => ['The provided credentials are incorrect.'],
                            ]);
                        }
                        // Hash the password for future use
                        DB::table('superadmin')
                            ->where('id', $superAdmin->id)
                            ->update(['password' => Hash::make($password)]);
                    } else {
                        // Hashed password - use Hash::check
                        if (!Hash::check($password, $superAdmin->password)) {
                            if (config('app.debug')) {
                                Log::warning('SuperAdmin password mismatch (hashed)', [
                                    'username' => $superAdmin->username,
                                    'username_provided' => $username,
                                    'password_hash_preview' => substr($superAdmin->password, 0, 20) . '...',
                                    'password_length' => strlen($password)
                                ]);
                            }
                            throw ValidationException::withMessages([
                                'username' => ['The provided credentials are incorrect. Please check your username and password.'],
                            ]);
                        }
                    }

                    // Superadmin login - create a temporary admin record or use existing one
                    // Optimized: Use indexed queries
                    $existingAdmin = Admin::where('username', $superAdmin->username)->first();
                    if (!$existingAdmin) {
                        $existingAdmin = Admin::where('email', $superAdmin->email)->first();
                    }

                    if (!$existingAdmin) {
                        // Create a temporary admin record for token generation
                        // Use try-catch to handle potential unique constraint violations
                        try {
                            $existingAdmin = Admin::create([
                                'full_name' => $superAdmin->full_name,
                                'email' => $superAdmin->email,
                                'username' => $superAdmin->username,
                                'password' => Hash::make('temp_password_' . uniqid()), // Temporary password
                            ]);
                        } catch (\Illuminate\Database\QueryException $e) {
                            // If creation fails due to unique constraint, try to find again
                            // This can happen if there's a race condition
                            $existingAdmin = Admin::where('username', $superAdmin->username)
                                ->orWhere('email', $superAdmin->email)
                                ->first();

                            if (!$existingAdmin) {
                                Log::error('Failed to create admin record for superadmin', [
                                    'superadmin_id' => $superAdmin->id,
                                    'username' => $superAdmin->username,
                                    'error' => $e->getMessage()
                                ]);
                                throw ValidationException::withMessages([
                                    'username' => ['Unable to complete login. Please contact administrator.'],
                                ]);
                            }
                        }
                    }

                    $role = 'admin';
                    $admin = $existingAdmin;
                    $userData = [
                        'id' => $admin->id,
                        'full_name' => $superAdmin->full_name,
                        'email' => $superAdmin->email,
                        'username' => $superAdmin->username,
                        'profile_image' => null,
                        'role' => 'admin',
                    ];
                } else {
                    // Not found in either table
                    if (config('app.debug')) {
                        Log::warning('User not found in admin or superadmin table', [
                            'username' => $username,
                            'searched_tables' => ['admin', 'superadmin']
                        ]);
                    }
                    throw ValidationException::withMessages([
                        'username' => ['The provided credentials are incorrect.'],
                    ]);
                }
            }
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            Log::error('Login error', [
                'error' => $e->getMessage(),
                'username' => $request->username ?? 'unknown'
            ]);
            throw ValidationException::withMessages([
                'username' => ['An error occurred during login. Please try again.'],
            ]);
        }

        // Create API token using the admin record (needed for Sanctum)
        $token = $admin->createToken('admin-token')->plainTextToken;

        // Reduced logging - only log successful login in debug mode
        if (config('app.debug')) {
            Log::info('Login successful', [
                'username' => $userData['username'],
                'role' => $role,
            ]);
        }

        return response()->json([
            'message' => 'Login successful',
            'admin' => $userData,
            'token' => $token,
        ]);
    }

    /**
     * Admin logout
     */
    public function logout(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $admin->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get current authenticated admin
     */
    public function me(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
                'profile_image' => $admin->profile_image ? url(\Storage::url($admin->profile_image)) : null,
            ]
        ]);
    }

    /**
     * Verify admin token
     */
    public function verify(Request $request)
    {
        $admin = $request->user();

        if (!$admin || !($admin instanceof Admin)) {
            return response()->json([
                'valid' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Optimized: Defer Storage URL generation
        $profileImageUrl = null;
        if ($admin->profile_image) {
            $profileImageUrl = url(\Storage::url($admin->profile_image));
        }

        return response()->json([
            'valid' => true,
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
                'profile_image' => $profileImageUrl,
            ]
        ]);
    }

    /**
     * Get all admins (for management purposes)
     */
    public function index()
    {
        $admins = Admin::select(['id', 'full_name', 'email', 'username', 'department', 'contact_number', 'position', 'created_at', 'updated_at'])
                      ->orderBy('created_at', 'desc')
                      ->get();

        // Add role information based on whether admin exists in superadmin table
        $adminsWithRole = $admins->map(function ($admin) {
            $isSuperAdmin = DB::table('superadmin')->where('email', $admin->email)->exists();
            $admin->role = $isSuperAdmin ? 'Admin' : 'Staff';
            return $admin;
        });

        return response()->json([
            'success' => true,
            'data' => $adminsWithRole
        ]);
    }

    /**
     * Create new admin
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admin,email',
            'username' => 'required|string|max:255|unique:admin,username',
            'password' => 'required|string|min:6',
        ]);

        $admin = Admin::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Admin created successfully',
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
            ]
        ], 201);
    }

    /**
     * Update admin
     */
    public function update(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        $rules = [
            'full_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:admin,email,' . $id,
            'username' => 'sometimes|required|string|max:255|unique:admin,username,' . $id,
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'required|string|min:6';
        }

        $request->validate($rules);

        $updateData = $request->only(['full_name', 'email', 'username']);

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $admin->update($updateData);

        // Refresh the admin to get updated data
        $admin->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Admin updated successfully',
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
            ]
        ]);
    }

    /**
     * Delete admin
     */
    public function destroy(Request $request, $id)
    {
        // Check authentication - support both Sanctum tokens and superadmin tokens
        $token = $request->bearerToken();
        $authenticated = false;

        if ($token) {
            // Check if this is a superadmin token (format: superadmin_token_TIMESTAMP_ID)
            if (strpos($token, 'superadmin_token_') === 0) {
                $parts = explode('_', $token);
                if (count($parts) >= 3) {
                    $superAdminId = end($parts);
                    $superAdmin = \App\Models\SuperAdmin::find($superAdminId);
                    if ($superAdmin) {
                        $authenticated = true;
                    }
                }
            } else {
                // Try Sanctum token (for Admin users)
                try {
                    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable instanceof Admin) {
                        $authenticated = true;
                    }
                } catch (\Exception $e) {
                    // Token validation failed
                }
            }
        }

        if (!$authenticated) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please log in to delete admin accounts.'
            ], 401);
        }

        $admin = Admin::findOrFail($id);

        // Get the currently logged-in admin
        $currentAdmin = null;
        if ($token) {
            if (strpos($token, 'superadmin_token_') === 0) {
                $parts = explode('_', $token);
                if (count($parts) >= 3) {
                    $superAdminId = end($parts);
                    $superAdmin = \App\Models\SuperAdmin::find($superAdminId);
                    if ($superAdmin) {
                        // Check if the admin being deleted matches the superadmin's email/username
                        $currentAdmin = Admin::where('email', $superAdmin->email)
                            ->orWhere('username', $superAdmin->username)
                            ->first();
                    }
                }
            } else {
                // Try Sanctum token (for Admin users)
                try {
                    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable instanceof Admin) {
                        $currentAdmin = $accessToken->tokenable;
                    }
                } catch (\Exception $e) {
                    // Token validation failed
                }
            }
        }

        // Prevent deleting the currently logged-in admin
        if ($currentAdmin && $currentAdmin->id == $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own account while logged in. Please log out first or use another admin account to delete this account.'
            ], 422);
        }

        // Prevent deleting the last admin
        if (Admin::count() <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the last admin account'
            ], 422);
        }

        // Revoke all tokens for this admin to force logout (BEFORE deletion)
        try {
            $adminTokens = \Laravel\Sanctum\PersonalAccessToken::where('tokenable_type', Admin::class)
                ->where('tokenable_id', $admin->id)
                ->delete();
        } catch (\Exception $e) {
            // Log but don't fail if token deletion fails
            Log::warning('Failed to revoke tokens for deleted admin', [
                'admin_id' => $admin->id,
                'error' => $e->getMessage()
            ]);
        }

        // Also check if this admin exists in superadmin table and delete from there too
        $superAdminToDelete = \App\Models\SuperAdmin::where('email', $admin->email)
            ->orWhere('username', $admin->username)
            ->first();

        // Delete from admin table (hard delete - Admin model doesn't use SoftDeletes)
        $admin->delete();

        // Also delete from superadmin table if exists (hard delete)
        if ($superAdminToDelete) {
            $superAdminToDelete->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Admin deleted successfully'
        ]);
    }

    /**
     * Get all approved admins with full details (for Admin/Staff Management tab)
     */
    public function getApprovedAdmins()
    {
        // Fetch staff accounts from admin table
        $admins = Admin::select([
            'id',
            'full_name',
            'email',
            'username',
            'created_at',
            'updated_at'
        ])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function($admin) {
            return [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
                'department' => 'N/A', // admin table doesn't have these fields
                'position' => 'N/A',
                'contact_number' => 'N/A',
                'role' => 'Staff',
                'status' => 'Approved',
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $admins
        ]);
    }

    /**
     * Upload profile image for admin
     *
     * Complete logic flow:
     * 1. Validate incoming image file
     * 2. Get authenticated admin user
     * 3. Check if admin already has profile image and delete old one
     * 4. Store new image with custom naming
     * 5. Update database
     * 6. Return response with image URL
     */
    public function uploadProfileImage(Request $request)
    {
        try {
            // Step 1: Validate incoming image file
            $request->validate([
                'image' => [
                    'required',
                    'image',
                    'mimes:jpeg,png,jpg,gif,webp',
                    'max:5120', // 5MB in KB
                ],
            ], [
                'image.required' => 'Please select an image file.',
                'image.image' => 'The file must be an image.',
                'image.mimes' => 'The image must be a file of type: jpeg, png, jpg, gif, webp.',
                'image.max' => 'The image may not be greater than 5MB.',
            ]);

            // Step 2: Get authenticated admin user
            // Try multiple methods to get the authenticated admin

            $admin = null;
            $token = $request->bearerToken();

            // Method 1: Try Sanctum's built-in user() method
            $admin = $request->user();

            // Method 2: If user() returns null, try to find token manually
            if (!$admin && $token) {
                try {
                    // Try to find the token in personal_access_tokens
                    $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);

                    if ($personalAccessToken) {
                        $tokenable = $personalAccessToken->tokenable;

                        // Verify it's an Admin model
                        if ($tokenable instanceof Admin) {
                            $admin = $tokenable;
                            Log::info('Admin authenticated via manual token lookup', [
                                'admin_id' => $admin->id,
                                'admin_username' => $admin->username
                            ]);
                        } else {
                            Log::warning('Token belongs to non-Admin model', [
                                'tokenable_type' => get_class($tokenable),
                                'tokenable_id' => $tokenable->id ?? null
                            ]);
                        }
                    } else {
                        // Token not found in database
                        Log::warning('Token not found in personal_access_tokens', [
                            'token_preview' => substr($token, 0, 30) . '...',
                            'token_length' => strlen($token)
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Error during token lookup', [
                        'error' => $e->getMessage(),
                        'token_preview' => $token ? substr($token, 0, 30) . '...' : 'null'
                    ]);
                }
            }

            // Method 3: If still no admin, check Authorization header directly
            if (!$admin) {
                $authHeader = $request->header('Authorization');
                if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
                    $tokenFromHeader = substr($authHeader, 7);
                    if ($tokenFromHeader && $tokenFromHeader !== $token) {
                        // Try with this token
                        try {
                            $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenFromHeader);
                            if ($personalAccessToken && $personalAccessToken->tokenable instanceof Admin) {
                                $admin = $personalAccessToken->tokenable;
                                Log::info('Admin authenticated via Authorization header token');
                            }
                        } catch (\Exception $e) {
                            Log::error('Error during Authorization header token lookup', [
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }
            }

            // Final check - if still no admin, return 401
            if (!$admin) {
                Log::warning('Profile image upload failed - no authenticated admin', [
                    'has_token' => !empty($token),
                    'token_preview' => $token ? substr($token, 0, 30) . '...' : 'null',
                    'auth_header' => $request->header('Authorization') ? 'present' : 'missing',
                    'request_user' => $request->user() ? get_class($request->user()) : 'null'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to upload a profile image.'
                ], 401);
            }

            // If this is a default admin token (id = 0), try to find the real admin account
            if ($admin->id === 0) {
                Log::info('Default admin token detected, attempting to find real admin account', [
                    'admin_username' => $admin->username ?? 'unknown',
                    'admin_email' => $admin->email ?? 'unknown'
                ]);

                // Try to find the real admin by username or email
                $realAdmin = null;
                if ($admin->username && $admin->username !== 'default_admin') {
                    $realAdmin = Admin::where('username', $admin->username)->first();
                }

                if (!$realAdmin && $admin->email && $admin->email !== 'default@admin.local') {
                    $realAdmin = Admin::where('email', $admin->email)->first();
                }

                if ($realAdmin) {
                    Log::info('Real admin account found for default token', [
                        'admin_id' => $realAdmin->id,
                        'admin_username' => $realAdmin->username
                    ]);
                    $admin = $realAdmin;
                } else {
                    Log::warning('No real admin account found for default token', [
                        'username' => $admin->username ?? 'unknown',
                        'email' => $admin->email ?? 'unknown'
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Unable to find your admin account. Please log in with your actual admin credentials to upload a profile image.'
                    ], 403);
                }
            }

            // Step 3: Check if admin already has profile image and delete old one
            if ($admin->profile_image) {
                $oldPath = $admin->profile_image;
                try {
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                } catch (\Exception $e) {
                    // Log error but don't fail the upload
                    Log::warning('Failed to delete old profile image', [
                        'admin_id' => $admin->id,
                        'old_path' => $oldPath,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Step 4: Store new image with custom naming
            // Generate unique filename: admin_{id}_{timestamp}.{extension}
            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();
            $timestamp = time();
            $filename = "admin_{$admin->id}_{$timestamp}.{$extension}";

            // Store in 'profile_images' folder (not 'admin_profile_images' for consistency)
            $path = $file->storeAs('profile_images', $filename, 'public');

            // Step 5: Update database
            $admin->profile_image = $path;
            $saved = $admin->save();

            if (!$saved) {
                // If database save fails, delete the uploaded file
                Storage::disk('public')->delete($path);
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save profile image to database.'
                ], 500);
            }

            // Step 6: Return response with image URL
            $imageUrl = asset('storage/' . $path);

            return response()->json([
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'data' => [
                    'profile_image' => $path,
                    'profile_image_url' => $imageUrl
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Validation errors
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error uploading profile image', [
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete profile image for admin
     *
     * Complete logic flow:
     * 1. Get authenticated admin user
     * 2. Check if profile image exists
     * 3. Delete image from storage
     * 4. Update database
     * 5. Return success response
     */
    public function deleteProfileImage(Request $request)
    {
        try {
            // Step 1: Get authenticated admin user
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Please log in to delete your profile image.'
                ], 401);
            }

            // Step 2: Check if profile image exists
            $imagePath = $admin->profile_image;

            if (!$imagePath) {
                return response()->json([
                    'success' => false,
                    'message' => 'No profile image found to delete.'
                ], 404);
            }

            // Step 3: Delete image from storage
            try {
                if (Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                } else {
                    // Image file doesn't exist in storage, but path exists in DB
                    // Continue to remove from database
                    Log::warning('Profile image file not found in storage', [
                        'admin_id' => $admin->id,
                        'image_path' => $imagePath
                    ]);
                }
            } catch (\Exception $e) {
                // Log error but continue to remove from database
                Log::error('Error deleting profile image file', [
                    'admin_id' => $admin->id,
                    'image_path' => $imagePath,
                    'error' => $e->getMessage()
                ]);
            }

            // Step 4: Update database
            $admin->profile_image = null;
            $saved = $admin->save();

            if (!$saved) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update database.'
                ], 500);
            }

            // Step 5: Return success response
            return response()->json([
                'success' => true,
                'message' => 'Profile image deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error deleting profile image', [
                'admin_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile image: ' . $e->getMessage()
            ], 500);
        }
    }
}
