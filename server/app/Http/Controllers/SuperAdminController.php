<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\AdminRegistration;

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

            // Verify password
            if (!Hash::check($credentials['password'], $superAdmin->password)) {
                \Log::warning('SuperAdmin password mismatch', ['username' => $credentials['username']]);

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
            // Fetch approved superadmins from admin_registrations table where requested_role is 'Super Admin'
            $superAdmins = AdminRegistration::select([
                'id',
                'full_name',
                'email',
                'username',
                'department',
                'position',
                'contact_number',
                'requested_role as role',
                'status',
                'created_at',
                'updated_at'
            ])
            ->where('status', 'Approved')
            ->where('requested_role', 'Super Admin')
            ->orderBy('created_at', 'desc')
            ->get();

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
}
