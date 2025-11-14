<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\Admin;
use App\Models\AdminRegistration;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    /**
     * Admin login
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Try to find admin by username or email
        $admin = Admin::where('username', $request->username)
                     ->orWhere('email', $request->username)
                     ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Create API token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Admin logout
     */
    public function logout(Request $request)
    {
        $request->user('admin')->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get current authenticated admin
     */
    public function me(Request $request)
    {
        $admin = $request->user('admin');

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
            ]
        ]);
    }

    /**
     * Verify admin token
     */
    public function verify(Request $request)
    {
        $admin = $request->user('admin');

        return response()->json([
            'valid' => true,
            'admin' => [
                'id' => $admin->id,
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'username' => $admin->username,
            ]
        ]);
    }

    /**
     * Get all admins (for management purposes)
     */
    public function index()
    {
        $admins = Admin::select(['id', 'full_name', 'email', 'username', 'created_at', 'updated_at'])
                      ->orderBy('created_at', 'desc')
                      ->get();

        return response()->json([
            'admins' => $admins
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

        return response()->json([
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
    public function destroy($id)
    {
        $admin = Admin::findOrFail($id);

        // Prevent deleting the last admin
        if (Admin::count() <= 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin account'
            ], 422);
        }

        $admin->delete();

        return response()->json([
            'message' => 'Admin deleted successfully'
        ]);
    }

    /**
     * Get all approved admins with full details (for Admin/Staff Management tab)
     */
    public function getApprovedAdmins()
    {
        // Fetch approved admin/staff from admin_registrations table where requested_role is 'Admin' or 'Staff'
        $admins = AdminRegistration::select([
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
        ->whereIn('requested_role', ['Admin', 'Staff'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $admins
        ]);
    }
}
