<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\AdminRegistration;
use App\Models\SuperAdmin;

class SuperAdminController extends Controller
{
    public function authenticate(Request $request)
    {
        try {
            $credentials = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            \Log::info('SuperAdmin authentication attempt', ['username' => $credentials['username']]);

            // Direct database query for superadmin
            $superAdmin = DB::table('superadmin')
                ->where('username', $credentials['username'])
                ->first();

            if (!$superAdmin) {
                \Log::warning('SuperAdmin not found', ['username' => $credentials['username']]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401)->withHeaders([
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                ]);
            }

            // Check if password is hashed (starts with $2y$ or $2a$)
            $isPasswordHashed = strpos($superAdmin->password, '$2y$') === 0 || strpos($superAdmin->password, '$2a$') === 0;

            $passwordValid = false;

            if (!$isPasswordHashed) {
                // Password is plain text - compare directly
                \Log::info('SuperAdmin password is plain text, comparing directly', [
                    'superadmin_id' => $superAdmin->id,
                    'username' => $superAdmin->username
                ]);

                if ($superAdmin->password === $credentials['password']) {
                    $passwordValid = true;
                    // Hash the password and save it for future use
                    \Log::info('Password matches, hashing and saving', [
                        'superadmin_id' => $superAdmin->id
                    ]);
                    DB::table('superadmin')
                        ->where('id', $superAdmin->id)
                        ->update(['password' => Hash::make($credentials['password'])]);
                }
            } else {
                // Password is hashed - use Hash::check
                $passwordValid = Hash::check($credentials['password'], $superAdmin->password);
            }

            if (!$passwordValid) {
                \Log::warning('SuperAdmin password mismatch', [
                    'username' => $credentials['username'],
                    'password_is_hashed' => $isPasswordHashed
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401)->withHeaders([
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                ]);
            }

            \Log::info('SuperAdmin authentication successful', ['username' => $credentials['username']]);

            // Generate token for session
            $token = 'superadmin_token_' . time() . '_' . $superAdmin->id;

            // Success response
            return response()->json([
                'success' => true,
                'message' => 'Authentication successful',
                'token' => $token,
                'superadmin' => [
                    'id' => $superAdmin->id,
                    'username' => $superAdmin->username,
                    'full_name' => $superAdmin->full_name,
                    'email' => $superAdmin->email,
                    'role' => 'superadmin'
                ]
            ])->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);

        } catch (\Exception $e) {
            \Log::error('SuperAdmin authentication error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Authentication failed'
            ], 500)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);
        }
    }

    /**
     * Get all approved superadmins with full details (for Admin/Staff Management tab)
     */
    public function getApprovedSuperAdmins()
    {
        try {
            // Fetch admin accounts from superadmin table
            $superAdmins = SuperAdmin::select([
                'id',
                'full_name',
                'email',
                'username',
                'department',
                'contact_number',
                'position',
                'created_at',
                'updated_at'
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($superAdmin) {
                return [
                    'id' => $superAdmin->id,
                    'full_name' => $superAdmin->full_name,
                    'email' => $superAdmin->email,
                    'username' => $superAdmin->username,
                    'department' => $superAdmin->department ?? 'N/A',
                    'position' => $superAdmin->position ?? 'N/A',
                    'contact_number' => $superAdmin->contact_number ?? 'N/A',
                    'role' => 'Admin',
                    'status' => 'Approved',
                    'created_at' => $superAdmin->created_at,
                    'updated_at' => $superAdmin->updated_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $superAdmins
            ])->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching superadmins', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch superadmin accounts'
            ], 500)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);
        }
    }

    /**
     * Update superadmin account
     */
    public function update(Request $request, $id)
    {
        try {
            $superAdmin = SuperAdmin::findOrFail($id);

            $rules = [
                'full_name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:superadmin,email,' . $id,
                'username' => 'sometimes|required|string|max:255|unique:superadmin,username,' . $id,
            ];

            if ($request->filled('password')) {
                $rules['password'] = 'required|string|min:6';
            }

            $request->validate($rules);

            $updateData = $request->only(['full_name', 'email', 'username']);

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $superAdmin->update($updateData);

            \Log::info('SuperAdmin updated', [
                'id' => $superAdmin->id,
                'username' => $superAdmin->username,
                'password_changed' => $request->filled('password')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SuperAdmin updated successfully',
                'data' => [
                    'id' => $superAdmin->id,
                    'full_name' => $superAdmin->full_name,
                    'email' => $superAdmin->email,
                    'username' => $superAdmin->username,
                ]
            ])->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating superadmin', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update superadmin account'
            ], 500)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);
        }
    }

    /**
     * Delete superadmin account
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Check authentication - support both Sanctum tokens and superadmin tokens
            $token = $request->bearerToken();
            $authenticated = false;

            if ($token) {
                // Check if this is a superadmin token (format: superadmin_token_TIMESTAMP_ID)
                if (strpos($token, 'superadmin_token_') === 0) {
                    $parts = explode('_', $token);
                    if (count($parts) >= 3) {
                        $superAdminId = end($parts);
                        $superAdmin = SuperAdmin::find($superAdminId);
                        if ($superAdmin) {
                            $authenticated = true;
                        }
                    }
                } else {
                    // Try Sanctum token (for Admin users)
                    try {
                        $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                        if ($accessToken) {
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
                    'message' => 'Unauthorized. Please log in to delete superadmin accounts.'
                ], 401)->withHeaders([
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                ]);
            }

            $superAdmin = SuperAdmin::findOrFail($id);

            // Prevent deleting the last superadmin
            if (SuperAdmin::count() <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the last superadmin account'
                ], 422)->withHeaders([
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                ]);
            }

            \Log::info('SuperAdmin deleted', [
                'id' => $superAdmin->id,
                'username' => $superAdmin->username
            ]);

            $superAdmin->delete();

            return response()->json([
                'success' => true,
                'message' => 'SuperAdmin deleted successfully'
            ])->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting superadmin', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete superadmin account'
            ], 500)->withHeaders([
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            ]);
        }
    }
}
