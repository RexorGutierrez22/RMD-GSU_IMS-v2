<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminRegistration;
use App\Models\Admin;
use App\Models\SuperAdmin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminRegistrationController extends Controller
{
    /**
     * Submit admin/staff registration request
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:admin_registrations,email|unique:admin,email',
            'username' => 'required|string|max:50|unique:admin_registrations,username|unique:admin,username',
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

            $registration = AdminRegistration::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'username' => $request->username,
                'password' => $request->password, // Will be hashed by model mutator
                'contact_number' => $request->contact_number,
                'department' => $request->department,
                'position' => $request->position,
                'requested_role' => $request->requested_role,
                'status' => 'pending'
            ]);

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

            // Determine which table to save to based on requested_role
            if ($registration->requested_role === 'admin') {
                // Save to superadmin table for admin (full access)
                $account = SuperAdmin::create([
                    'full_name' => $registration->full_name,
                    'email' => $registration->email,
                    'username' => $registration->username,
                    'password' => $registration->password, // Already hashed
                ]);

                $accountType = 'superadmin';
                $formattedId = 'SADM-' . str_pad($account->id, 3, '0', STR_PAD_LEFT);
            } else {
                // Save to admin table for staff
                $account = Admin::create([
                    'full_name' => $registration->full_name,
                    'email' => $registration->email,
                    'username' => $registration->username,
                    'password' => $registration->password, // Already hashed
                ]);

                $accountType = 'admin';
                $formattedId = 'ADM-' . str_pad($account->id, 3, '0', STR_PAD_LEFT);
            }

            // Update registration status
            $registration->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => 1 // Super Admin ID (you might want to get this from authenticated user)
            ]);

            Log::info('Admin/Staff registration approved', [
                'registration_id' => $registration->id,
                'account_id' => $account->id,
                'account_type' => $accountType,
                'email' => $account->email,
                'role' => $registration->requested_role
            ]);

            // Send approval email (implement later)

            return response()->json([
                'success' => true,
                'message' => 'Registration approved successfully! ' . ucfirst($accountType) . ' account created.',
                'data' => [
                    'account_id' => $account->id,
                    'account_type' => $accountType,
                    'formatted_id' => $formattedId,
                    'username' => $account->username,
                    'email' => $account->email,
                    'role' => $registration->requested_role,
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

            $registration->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejection_reason' => $request->rejection_reason,
                'approved_by' => 1 // Super Admin ID
            ]);

            Log::info('Admin registration rejected', [
                'registration_id' => $registration->id,
                'email' => $registration->email,
                'reason' => $request->rejection_reason
            ]);

            // Send rejection email (implement later)

            return response()->json([
                'success' => true,
                'message' => 'Registration rejected successfully',
                'data' => [
                    'registration_id' => $registration->formatted_id,
                    'status' => $registration->status,
                    'rejection_reason' => $registration->rejection_reason,
                    'rejected_at' => $registration->rejected_at->format('Y-m-d H:i:s')
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
     * Send OTP for email verification (FREE - using PHP mail)
     */
    public function sendOTP(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
            'full_name' => 'nullable|string'
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

            $fullName = $request->full_name ?? 'User';
            $otpCode = $request->otp_code;

            // Email content
            $subject = 'USEP RMD IMS - Email Verification Code';
            $message = "
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #dc2626 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔐 Email Verification</h1>
                            <p>USEP RMD Inventory Management System</p>
                        </div>
                        <div class='content'>
                            <p>Hello <strong>{$fullName}</strong>,</p>
                            <p>Thank you for registering for Admin/Staff access to the USEP RMD Inventory Management System.</p>
                            <p>Please use the following One-Time Password (OTP) to verify your email address:</p>

                            <div class='otp-box'>
                                <p style='margin: 0; color: #6b7280; font-size: 14px;'>Your OTP Code:</p>
                                <p class='otp-code'>{$otpCode}</p>
                                <p style='margin: 0; color: #6b7280; font-size: 12px;'>Valid for 10 minutes</p>
                            </div>

                            <p><strong>Important:</strong></p>
                            <ul>
                                <li>This code will expire in 10 minutes</li>
                                <li>Do not share this code with anyone</li>
                                <li>If you didn't request this, please ignore this email</li>
                            </ul>

                            <p>After verification, your registration will be submitted to the Super Admin for approval.</p>
                        </div>
                        <div class='footer'>
                            <p>University of Southeastern Philippines</p>
                            <p>RMD Inventory Management System</p>
                        </div>
                    </div>
                </body>
                </html>
            ";

            // Headers for HTML email
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: USEP RMD IMS <noreply@usep.edu.ph>" . "\r\n";

            // DEVELOPMENT MODE: Skip actual email sending
            // For production, remove this block and use real email service (Gmail SMTP, SendGrid, etc.)
            $isDevelopment = config('app.env') === 'local' || config('app.debug') === true;

            if ($isDevelopment) {
                // Development: Don't send email, just return OTP for testing
                Log::info('🔧 DEV MODE: OTP generated (email not sent)', [
                    'email' => $email,
                    'otp_code' => $otpCode,
                    'otp_sent_at' => now()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'OTP sent successfully to your email',
                    'dev_mode' => true,
                    'otp_code' => $otpCode, // Only in development!
                    'note' => 'Development Mode: Email not actually sent. Use the OTP code above.'
                ]);
            }

            // PRODUCTION MODE: Send actual email
            $mailSent = mail($email, $subject, $message, $headers);

            if ($mailSent) {
                Log::info('OTP email sent successfully', [
                    'email' => $email,
                    'otp_sent_at' => now()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'OTP sent successfully to your email'
                ]);
            } else {
                throw new \Exception('Failed to send email');
            }

        } catch (\Exception $e) {
            Log::error('Failed to send OTP email', [
                'error' => $e->getMessage(),
                'email' => $request->email
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again later.'
            ], 500);
        }
    }
}
