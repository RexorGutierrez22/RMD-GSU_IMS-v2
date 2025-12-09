<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminRegistration;
use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Models\RejectedRegistration;
use App\Mail\StaffVerificationMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminRegistrationController extends Controller
{
    /**
     * Submit admin/staff registration request
     */
    public function register(Request $request): JsonResponse
    {
        // Check if there's an existing verified registration for this email
        $existingVerified = AdminRegistration::where('email', $request->email)
            ->where('status', 'pending')
            ->whereNotNull('email_verified_at')
            ->first();

        $emailRule = 'required|email|unique:admin,email';
        $usernameRule = 'required|string|max:50|unique:admin,username';

        // Allow existing email/username if it's from the verified temporary registration
        if ($existingVerified) {
            $emailRule .= '|unique:admin_registrations,email,' . $existingVerified->id;
            $usernameRule .= '|unique:admin_registrations,username,' . $existingVerified->id;
        } else {
            $emailRule .= '|unique:admin_registrations,email';
            $usernameRule .= '|unique:admin_registrations,username';
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => $emailRule,
            'username' => $usernameRule,
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[A-Z]/',      // Must contain at least one uppercase letter
                'regex:/[0-9]/',      // Must contain at least one number
                'regex:/[!@#$%^&*(),.?":{}|<>]/' // Must contain at least one special character
            ],
            'contact_number' => 'nullable|string|max:20',
            'department' => 'required|string|max:100',
            'position' => 'required|string|max:100',
            'requested_role' => 'required|in:admin,staff'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate USEP email domain - STRICT: Only @usep.edu.ph
            $email = strtolower($request->email);
            if (!str_ends_with($email, '@usep.edu.ph')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration is only allowed for USEP institutional email addresses (@usep.edu.ph)'
                ], 422);
            }

            // Check if email is verified (from email authentication code verification step)
            $existingRegistration = AdminRegistration::where('email', $email)
                ->where('status', 'pending')
                ->whereNotNull('email_verified_at')
                ->first();

            if ($existingRegistration) {
                // Update existing registration with full form data
                $existingRegistration->update([
                    'full_name' => $request->full_name,
                    'username' => $request->username,
                    'password' => $request->password, // Will be hashed by model mutator
                    'contact_number' => $request->contact_number,
                    'department' => $request->department,
                    'position' => $request->position,
                    'requested_role' => $request->requested_role,
                    'status' => 'pending'
                ]);
                $registration = $existingRegistration;
            } else {
                // Email not verified - require email authentication code verification first
                return response()->json([
                    'success' => false,
                    'message' => 'Email verification required. Please verify your email first.',
                    'requires_verification' => true
                ], 422);
            }

            // Send notification to super admin (implement email later)
            Log::info('New admin registration submitted', [
                'registration_id' => $registration->id,
                'email' => $registration->email,
                'requested_role' => $registration->requested_role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registration request submitted successfully! Please wait for Super Admin approval.',
                'data' => [
                    'registration_id' => $registration->formatted_id,
                    'status' => $registration->status,
                    'submitted_at' => $registration->created_at->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Admin registration error', [
                'error' => $e->getMessage(),
                'request_data' => $request->except(['password', 'password_confirmation'])
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Get all pending registrations (Super Admin only)
     */
    public function getPendingRegistrations(): JsonResponse
    {
        try {
            $registrations = AdminRegistration::pending()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($registration) {
                    return [
                        'id' => $registration->id,
                        'formatted_id' => $registration->formatted_id,
                        'full_name' => $registration->full_name,
                        'email' => $registration->email,
                        'username' => $registration->username,
                        'contact_number' => $registration->contact_number,
                        'department' => $registration->department,
                        'position' => $registration->position,
                        'requested_role' => $registration->requested_role,
                        'status' => $registration->status,
                        'status_color' => $registration->status_color,
                        'is_usep_email' => $registration->isUsepEmail(),
                        'submitted_at' => $registration->created_at->format('Y-m-d H:i:s'),
                        'days_pending' => $registration->created_at->diffInDays(now())
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $registrations,
                'count' => $registrations->count(),
                'message' => 'Pending registrations retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get pending registrations', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending registrations',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Approve admin registration (Super Admin only)
     */
    public function approveRegistration(Request $request, int $registrationId): JsonResponse
    {
        try {
            $registration = AdminRegistration::find($registrationId);

            if (!$registration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration not found'
                ], 404);
            }

            if ($registration->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration has already been processed'
                ], 400);
            }

            // Check if email or username already exists in admin or superadmin tables
            $existingAdmin = Admin::where('email', $registration->email)
                ->orWhere('username', $registration->username)
                ->first();

            $existingSuperAdmin = SuperAdmin::where('email', $registration->email)
                ->orWhere('username', $registration->username)
                ->first();

            if ($existingAdmin || $existingSuperAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'An account with this email or username already exists. Please use different credentials.',
                    'existing_account' => [
                        'email' => $existingAdmin?->email ?? $existingSuperAdmin?->email,
                        'username' => $existingAdmin?->username ?? $existingSuperAdmin?->username,
                        'table' => $existingAdmin ? 'admin' : 'superadmin'
                    ]
                ], 409);
            }

            // Determine which table(s) to save to based on requested_role
            // Use database transaction to ensure atomicity when creating in multiple tables
            DB::beginTransaction();

            try {
                if ($registration->requested_role === 'admin') {
                    // For admin (full access): Save to BOTH admin and superadmin tables
                    // This allows them to login via both /admin/login and /superadmin/login

                    // Create in admin table first (for /admin/login access)
                    $adminAccount = Admin::create([
                        'full_name' => $registration->full_name,
                        'email' => $registration->email,
                        'username' => $registration->username,
                        'password' => $registration->password, // Already hashed
                        'department' => $registration->department,
                        'contact_number' => $registration->contact_number,
                        'position' => $registration->position,
                    ]);

                    // Also create in superadmin table (for /superadmin/login access)
                    $superAdminAccount = SuperAdmin::create([
                        'full_name' => $registration->full_name,
                        'email' => $registration->email,
                        'username' => $registration->username,
                        'password' => $registration->password, // Already hashed
                        'department' => $registration->department,
                        'contact_number' => $registration->contact_number,
                        'position' => $registration->position,
                    ]);

                    $account = $superAdminAccount; // Use superadmin account for response
                    $accountType = 'superadmin';
                    $formattedId = 'SADM-' . str_pad($superAdminAccount->id, 3, '0', STR_PAD_LEFT);
                } else {
                    // For staff (limited access): Save ONLY to admin table
                    // They can only login via /admin/login, NOT /superadmin/login
                    $account = Admin::create([
                        'full_name' => $registration->full_name,
                        'email' => $registration->email,
                        'username' => $registration->username,
                        'password' => $registration->password, // Already hashed
                        'department' => $registration->department,
                        'contact_number' => $registration->contact_number,
                        'position' => $registration->position,
                    ]);

                    $accountType = 'admin';
                    $formattedId = 'ADM-' . str_pad($account->id, 3, '0', STR_PAD_LEFT);
                }

                // Commit the transaction if all creates were successful
                DB::commit();
            } catch (\Exception $e) {
                // Rollback the transaction if any create failed
                DB::rollBack();
                throw $e;
            }

            // Update registration status
            $registration->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => 1 // Super Admin ID (you might want to get this from authenticated user)
            ]);

            Log::info('Admin/Staff registration approved and transferred', [
                'registration_id' => $registration->id,
                'account_id' => $account->id,
                'account_type' => $accountType,
                'email' => $account->email,
                'role' => $registration->requested_role,
                'transferred_to_table' => $registration->requested_role === 'admin' ? 'admin and superadmin (both)' : 'admin only'
            ]);

            // Optionally delete from admin_registrations after successful transfer
            // Uncomment the line below if you want to remove approved requests from the table
            // $registration->delete();

            // Send approval email (implement later)

            // Customize message based on role
            if ($registration->requested_role === 'admin') {
                $successMessage = 'Registration approved successfully! Admin account created in both admin and superadmin tables (full access).';
            } else {
                $successMessage = 'Registration approved successfully! Staff account created (limited access).';
            }

            return response()->json([
                'success' => true,
                'message' => $successMessage,
                'data' => [
                    'account_id' => $account->id,
                    'account_type' => $accountType,
                    'formatted_id' => $formattedId,
                    'username' => $account->username,
                    'email' => $account->email,
                    'role' => $registration->requested_role,
                    'has_full_access' => $registration->requested_role === 'admin', // Indicates if they can login to both admin and superadmin
                    'approved_at' => $registration->approved_at->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Admin registration approval error', [
                'registration_id' => $registrationId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve registration',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Reject admin registration (Super Admin only)
     */
    public function rejectRegistration(Request $request, int $registrationId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a rejection reason',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $registration = AdminRegistration::find($registrationId);

            if (!$registration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration not found'
                ], 404);
            }

            if ($registration->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration has already been processed'
                ], 400);
            }

            // Transfer data to rejected_registrations table
            $rejectedRecord = RejectedRegistration::create([
                'full_name' => $registration->full_name,
                'email' => $registration->email,
                'username' => $registration->username,
                'password' => $registration->password,
                'contact_number' => $registration->contact_number,
                'department' => $registration->department,
                'position' => $registration->position,
                'requested_role' => $registration->requested_role,
                'rejection_reason' => $request->rejection_reason,
                'rejected_at' => now(),
                'rejected_by' => 1, // Super Admin ID (you might want to get this from authenticated user)
                'originally_requested_at' => $registration->created_at,
            ]);

            // Update original registration status
            $registration->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejection_reason' => $request->rejection_reason,
                'approved_by' => 1 // Super Admin ID
            ]);

            Log::info('Admin registration rejected and moved to rejected_registrations', [
                'registration_id' => $registration->id,
                'rejected_record_id' => $rejectedRecord->id,
                'email' => $registration->email,
                'reason' => $request->rejection_reason
            ]);

            // Optionally delete from admin_registrations after moving to rejected_registrations
            // $registration->delete();

            // Send rejection email (implement later)

            return response()->json([
                'success' => true,
                'message' => 'Registration rejected and archived successfully',
                'data' => [
                    'registration_id' => $registration->formatted_id,
                    'status' => $registration->status,
                    'rejection_reason' => $registration->rejection_reason,
                    'rejected_at' => $registration->rejected_at->format('Y-m-d H:i:s'),
                    'archived_to_rejected_table' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Admin registration rejection error', [
                'registration_id' => $registrationId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject registration',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Get registration history (Super Admin only)
     */
    public function getRegistrationHistory(): JsonResponse
    {
        try {
            $registrations = AdminRegistration::with('approvedBy')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function($registration) {
                    return [
                        'id' => $registration->id,
                        'formatted_id' => $registration->formatted_id,
                        'full_name' => $registration->full_name,
                        'email' => $registration->email,
                        'username' => $registration->username,
                        'department' => $registration->department,
                        'position' => $registration->position,
                        'requested_role' => $registration->requested_role,
                        'status' => $registration->status,
                        'status_color' => $registration->status_color,
                        'rejection_reason' => $registration->rejection_reason,
                        'submitted_at' => $registration->created_at->format('Y-m-d H:i:s'),
                        'processed_at' => $registration->approved_at?->format('Y-m-d H:i:s') ??
                                        $registration->rejected_at?->format('Y-m-d H:i:s'),
                        'approved_by' => $registration->approvedBy?->full_name
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $registrations,
                'summary' => [
                    'total' => $registrations->count(),
                    'pending' => $registrations->where('status', 'pending')->count(),
                    'approved' => $registrations->where('status', 'approved')->count(),
                    'rejected' => $registrations->where('status', 'rejected')->count()
                ],
                'message' => 'Registration history retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get registration history', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve registration history',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Send Email Authentication Code for email verification (using Laravel Mail facade)
     */
    public function sendOTP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'full_name' => 'nullable|string',
            'username' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate USEP email domain
            $email = strtolower($request->email);
            if (!str_ends_with($email, '@usep.edu.ph')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only USEP institutional email addresses are allowed (@usep.edu.ph)'
                ], 422);
            }

            // Check if email already exists in admin table, reject
            if (Admin::where('email', $email)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This email is already registered as an admin/staff member.'
                ], 422);
            }

            // Check if email already exists in admin_registrations table (any status)
            // We need to check ALL statuses because email has unique constraint
            $existingRegistration = AdminRegistration::where('email', $email)->first();

            // Generate 6-digit verification code
            $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            if ($existingRegistration) {
                // Update existing registration with new email authentication code
                // Reset status to pending if it was rejected/approved
                $updateData = [
                    'email_verification_code' => $verificationCode,
                    'verification_code_expires_at' => Carbon::now()->addMinutes(15),
                    'verification_attempts' => 0, // Reset attempts
                    'status' => 'pending', // Reset to pending for new attempt
                    'rejection_reason' => null,
                    'rejected_at' => null,
                    'approved_at' => null,
                    'approved_by' => null
                ];

                // Update optional fields if provided
                if ($request->full_name) {
                    $updateData['full_name'] = $request->full_name;
                }
                if ($request->has('department')) {
                    $updateData['department'] = $request->department;
                }
                if ($request->has('position')) {
                    $updateData['position'] = $request->position;
                }
                if ($request->requested_role) {
                    $updateData['requested_role'] = $request->requested_role;
                }
                if ($request->username && strlen($request->username) >= 3) {
                    // Check if username is available before updating
                    $usernameAvailable = !AdminRegistration::where('username', $request->username)
                        ->where('id', '!=', $existingRegistration->id)->exists() &&
                        !Admin::where('username', $request->username)->exists() &&
                        !SuperAdmin::where('username', $request->username)->exists();

                    if ($usernameAvailable) {
                        $updateData['username'] = $request->username;
                    }
                }

                $existingRegistration->update($updateData);
                $registration = $existingRegistration;

                Log::info('Updated existing registration for OTP', [
                    'registration_id' => $registration->id,
                    'email' => $email,
                    'previous_status' => $existingRegistration->getOriginal('status')
                ]);
            } else {
                // Create temporary registration record for email authentication code verification
                // This will be used later when actual registration is submitted
                // Generate a temporary unique username if not provided
                $baseUsername = $request->username;
                $tempUsername = null;

                if ($baseUsername && strlen($baseUsername) >= 3) {
                    // Check if provided username is available
                    $usernameAvailable = !AdminRegistration::where('username', $baseUsername)->exists() &&
                                        !Admin::where('username', $baseUsername)->exists() &&
                                        !SuperAdmin::where('username', $baseUsername)->exists();

                    if ($usernameAvailable) {
                        $tempUsername = $baseUsername;
                    }
                }

                // Generate unique temporary username if not provided or not available
                if (!$tempUsername) {
                    $attempts = 0;
                    do {
                        $tempUsername = 'temp_' . uniqid() . '_' . substr(md5($email . microtime(true)), 0, 6);
                        $attempts++;

                        if ($attempts > 10) {
                            throw new \Exception('Unable to generate unique temporary username');
                        }
                    } while (AdminRegistration::where('username', $tempUsername)->exists() ||
                             Admin::where('username', $tempUsername)->exists() ||
                             SuperAdmin::where('username', $tempUsername)->exists());
                }

                try {
                    $registration = AdminRegistration::create([
                        'email' => $email,
                        'full_name' => $request->full_name ?? 'User',
                        'username' => $tempUsername,
                        'password' => Hash::make('temp_password_' . uniqid()), // Temporary password
                        'department' => $request->department ?? null, // Nullable field
                        'position' => $request->position ?? null, // Nullable field
                        'requested_role' => $request->requested_role ?? 'staff', // Has default
                        'email_verification_code' => $verificationCode,
                        'verification_code_expires_at' => Carbon::now()->addMinutes(15),
                        'verification_attempts' => 0,
                        'status' => 'pending'
                    ]);
                } catch (\Illuminate\Database\QueryException $e) {
                    Log::error('Database error creating temporary registration', [
                        'error' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'email' => $email,
                        'username' => $tempUsername
                    ]);

                    // Check if it's a unique constraint violation
                    if ($e->getCode() == 23000) {
                        // Try again with a different username
                        $tempUsername = 'temp_' . uniqid() . '_' . substr(md5($email . microtime(true)), 0, 6);
                        $registration = AdminRegistration::create([
                            'email' => $email,
                            'full_name' => $request->full_name ?? 'User',
                            'username' => $tempUsername,
                            'password' => Hash::make('temp_password_' . uniqid()),
                            'department' => $request->department ?? null,
                            'position' => $request->position ?? null,
                            'requested_role' => $request->requested_role ?? 'staff',
                            'email_verification_code' => $verificationCode,
                            'verification_code_expires_at' => Carbon::now()->addMinutes(15),
                            'verification_attempts' => 0,
                            'status' => 'pending'
                        ]);
                    } else {
                        throw $e;
                    }
                }
            }

            // Send verification email using Laravel Mail facade
            try {
                Mail::to($email)->send(new StaffVerificationMail($registration, $verificationCode));

                Log::info('Staff verification email sent successfully', [
                    'registration_id' => $registration->id,
                    'email' => $email
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Email authentication code has been sent to your email. Please check your inbox to verify your email address and confirm its legitimacy.',
                    'registration_id' => $registration->id
                ]);

            } catch (\Exception $e) {
                Log::error('Failed to send verification email', [
                    'registration_id' => $registration->id,
                    'email' => $email,
                    'error' => $e->getMessage()
                ]);

                // Delete temporary registration if email fails
                if (!$existingRegistration) {
                    $registration->delete();
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send verification email. Please try again later.',
                    'error' => 'Email service unavailable'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to send email authentication code', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $request->email,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email authentication code. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Verify Email Authentication Code for email verification
     */
    public function verifyOTP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'verification_code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = strtolower($request->email);
            $verificationCode = $request->verification_code;

            // Find registration by email
            $registration = AdminRegistration::where('email', $email)
                ->where('status', 'pending')
                ->first();

            if (!$registration) {
                return response()->json([
                    'success' => false,
                    'message' => 'No pending registration found for this email. Please request a new verification code.'
                ], 404);
            }

            // Check if code has expired
            if ($registration->verification_code_expires_at &&
                Carbon::now()->gt($registration->verification_code_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification code has expired. Please request a new code.',
                    'code_expired' => true
                ], 400);
            }

            // Check if max attempts reached
            if ($registration->verification_attempts >= 5) {
                // Delete the registration record after 5 failed attempts
                $registration->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum verification attempts reached. Please register again.',
                    'max_attempts_reached' => true
                ], 400);
            }

            // Verify code
            if ($registration->email_verification_code !== $verificationCode) {
                $registration->increment('verification_attempts');
                $remainingAttempts = 5 - $registration->verification_attempts;

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code. ' . ($remainingAttempts > 0 ? "You have {$remainingAttempts} attempt(s) remaining." : 'Maximum attempts reached.'),
                    'remaining_attempts' => $remainingAttempts,
                    'max_attempts_reached' => $remainingAttempts === 0
                ], 400);
            }

            // Code is correct - mark email as verified
            $registration->update([
                'email_verified_at' => Carbon::now(),
                'email_verification_code' => null,
                'verification_code_expires_at' => null,
                'verification_attempts' => 0
            ]);

            Log::info('Email verified successfully', [
                'registration_id' => $registration->id,
                'email' => $email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully! You can now proceed with registration.',
                'email_verified' => true,
                'registration_id' => $registration->id
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to verify email authentication code', [
                'error' => $e->getMessage(),
                'email' => $request->email
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify email authentication code. Please try again.'
            ], 500);
        }
    }

    /**
     * Check username uniqueness (for real-time validation)
     */
    public function checkUsernameUniqueness(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|min:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username format',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $username = $request->username;

            // Check if username exists in admin_registrations table
            $existsInRegistrations = AdminRegistration::where('username', $username)->exists();

            // Check if username exists in admin table
            $existsInAdmin = Admin::where('username', $username)->exists();

            // Check if username exists in superadmin table
            $existsInSuperAdmin = SuperAdmin::where('username', $username)->exists();

            $usernameExists = $existsInRegistrations || $existsInAdmin || $existsInSuperAdmin;

            return response()->json([
                'success' => true,
                'username_exists' => $usernameExists,
                'message' => $usernameExists ? 'Username is already taken' : 'Username is available'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to check username uniqueness', [
                'error' => $e->getMessage(),
                'username' => $request->username
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check username availability'
            ], 500);
        }
    }
}
