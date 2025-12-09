<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmployeeRegistrationMail;
use App\Mail\EmployeeVerificationMail;
use Carbon\Carbon;

class EmployeeController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Check for existing records across both students and employees tables
            $existingEmail = Employee::where('email', $request->email)->exists() ||
                           \App\Models\Student::where('email', $request->email)->exists();

            $existingContact = Employee::where('contact_number', $request->contact)->exists() ||
                             \App\Models\Student::where('contact_number', $request->contact)->exists();

            $existingEmpId = Employee::where('emp_id', $request->emp_id)->exists();

            // Build custom validation errors
            $errors = [];
            if ($existingEmail) {
                $errors['email'] = ['This email address is already registered.'];
            }
            if ($existingContact) {
                $errors['contact'] = ['This contact number is already registered.'];
            }
            if ($existingEmpId) {
                $errors['emp_id'] = ['This employee ID is already taken.'];
            }

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration failed. Please check the highlighted fields.',
                    'errors' => $errors
                ], 422)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Validate request data with standard validation
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'email' => 'required|string|email|max:255',
                'emp_id' => 'required|string|max:255',
                'position' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'contact' => 'required|string|digits:11',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Employee registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed due to a system error. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }

        // Generate 6-digit verification code
        $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Create employee record with unverified status
        $employee = Employee::create([
            'first_name' => $validatedData['first_name'],
            'last_name' => $validatedData['last_name'],
            'middle_name' => $validatedData['middle_name'] ?? null,
            'email' => $validatedData['email'],
            'emp_id' => $validatedData['emp_id'],
            'position' => $validatedData['position'],
            'department' => $validatedData['department'],
            'contact_number' => $validatedData['contact'],  // Map contact to contact_number
            'status' => 'inactive',  // Set to inactive until email is verified
            'email_verification_code' => $verificationCode,
            'verification_code_expires_at' => Carbon::now()->addMinutes(15),
            'verification_attempts' => 0
        ]);

        // Send verification email
        try {
            Mail::to($employee->email)->send(new EmployeeVerificationMail($employee, $verificationCode));
            \Log::info('Verification email sent successfully', [
                'employee_id' => $employee->id,
                'email' => $employee->email
            ]);
        } catch (\Exception $e) {
            // Log email error and delete the employee record
            \Log::error('Failed to send verification email', [
                'employee_id' => $employee->id,
                'email' => $employee->email,
                'error' => $e->getMessage()
            ]);

            // Delete the employee record if email fails
            $employee->delete();

            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification email. Please try again.',
                'error' => 'Email service unavailable'
            ], 500)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }

        return response()->json([
            'success' => true,
            'message' => 'Registration submitted! Please check your email for the verification code.',
            'requires_verification' => true,
            'employee_id' => $employee->id,
            'email' => $employee->email
        ], 201)->header('Access-Control-Allow-Origin', '*')
             ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    // Get QR code for an existing employee
    public function getQRCode($id)
    {
        try {
            $employee = Employee::findOrFail($id);

            if (!$employee->qr_code_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code not found for this employee'
                ], 404);
            }

            // Extract filename from path
            $filename = basename($employee->qr_code_path);

            return response()->json([
                'success' => true,
                'employee' => [
                    'id' => $employee->id,
                    'emp_id' => $employee->emp_id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'email' => $employee->email,
                    'position' => $employee->position,
                    'department' => $employee->department,
                    'qr_code_data' => $employee->qr_code ? json_decode($employee->qr_code, true) : null
                ],
                'qr_url' => url("api/qr-display/employees/{$filename}"),
                'qr_download_url' => url("api/download-qr/employees/{$filename}")
            ])->header('Access-Control-Allow-Origin', '*')
              ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
              ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            \Log::error('Employee QR code retrieval error', [
                'error' => $e->getMessage(),
                'employee_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve QR code'
            ], 500);
        }
    }

    // Live uniqueness checking for real-time validation
    public function checkUniqueness(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('Employee uniqueness check request received', [
                'data' => $request->all(),
                'emp_id' => $request->emp_id,
                'email' => $request->email,
                'contact' => $request->contact
            ]);

            $response = [
                'empIdExists' => false,
                'emailExists' => false,
                'contactExists' => false
            ];

            // Check employee ID uniqueness
            if ($request->has('emp_id') && $request->emp_id) {
                $response['empIdExists'] = Employee::where('emp_id', $request->emp_id)->exists();
            }

            // Check email uniqueness across both employees and students
            if ($request->has('email') && $request->email) {
                $response['emailExists'] = Employee::where('email', $request->email)->exists() ||
                                         \App\Models\Student::where('email', $request->email)->exists();
            }

            // Check contact uniqueness across both employees and students
            if ($request->has('contact') && $request->contact) {
                $employeeContactExists = Employee::where('contact_number', $request->contact)->exists();
                $studentContactExists = \App\Models\Student::where('contact_number', $request->contact)->exists();
                $response['contactExists'] = $employeeContactExists || $studentContactExists;

                \Log::info('Contact uniqueness check', [
                    'contact' => $request->contact,
                    'employeeContactExists' => $employeeContactExists,
                    'studentContactExists' => $studentContactExists,
                    'finalResult' => $response['contactExists']
                ]);
            }

            \Log::info('Employee uniqueness check response', $response);
            return response()->json($response)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            \Log::error('Employee uniqueness check error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'empIdExists' => false,
                'emailExists' => false,
                'contactExists' => false,
                'error' => 'Unable to check uniqueness at this time'
            ], 500);
        }
    }

    // List all employees
    public function index(Request $request)
    {
        try {
            $employees = Employee::notArchived()->select([
                'id', 'first_name', 'last_name', 'middle_name',
                'email', 'emp_id', 'department', 'position', 'contact_number',
                'qr_code_path', 'status', 'created_at'
            ])->get();

            // Add QR code URLs for employees who have them
            $employees = $employees->map(function ($employee) {
                if ($employee->qr_code_path) {
                    $filename = basename($employee->qr_code_path);
                    $employee->qr_url = url("api/qr-display/employees/{$filename}");
                    $employee->qr_download_url = url("api/download-qr/employees/{$filename}");
                    $employee->has_qr_code = true;
                } else {
                    $employee->qr_url = null;
                    $employee->qr_download_url = null;
                    $employee->has_qr_code = false;
                }
                return $employee;
            });

            return response()->json($employees);
        } catch (\Exception $e) {
            \Log::error('Employees index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to fetch employees',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Update employee data
    public function update(Request $request, $id)
    {
        try {
            // Find the employee
            $employee = Employee::findOrFail($id);

            // Check for existing records across both students and employees tables (excluding current employee)
            $existingEmail = Employee::where('email', $request->email)
                                   ->where('id', '!=', $id)
                                   ->exists() ||
                            \App\Models\Student::where('email', $request->email)->exists();

            $existingContact = Employee::where('contact_number', $request->contact_number)
                                     ->where('id', '!=', $id)
                                     ->exists() ||
                              \App\Models\Student::where('contact_number', $request->contact_number)->exists();

            $existingEmpId = Employee::where('emp_id', $request->emp_id)
                                   ->where('id', '!=', $id)
                                   ->exists();

            // Build custom validation errors
            $errors = [];
            if ($existingEmail) {
                $errors['email'] = ['This email address is already registered.'];
            }
            if ($existingContact) {
                $errors['contact_number'] = ['This contact number is already registered.'];
            }
            if ($existingEmpId) {
                $errors['emp_id'] = ['This employee ID is already taken.'];
            }

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Update failed. Please check the highlighted fields.',
                    'errors' => $errors
                ], 422)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Validate request data
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'email' => 'required|email',
                'emp_id' => 'required|string',
                'department' => 'required|string|max:255',
                'position' => 'required|string|max:255',
                'contact_number' => 'required|string|digits:11',
                'status' => 'nullable|string|in:active,inactive'
            ]);

            // Update employee record
            $employee->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'email' => $validated['email'],
                'emp_id' => $validated['emp_id'],
                'department' => $validated['department'],
                'position' => $validated['position'],
                'contact_number' => $validated['contact_number'],
                'status' => $validated['status'] ?? 'active'
            ]);

            // Refresh the model to get updated data
            $employee->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully!',
                'employee' => [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'middle_name' => $employee->middle_name,
                    'email' => $employee->email,
                    'emp_id' => $employee->emp_id,
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'contact_number' => $employee->contact_number,
                    'status' => $employee->status,
                    'created_at' => $employee->created_at
                ]
            ])->header('Access-Control-Allow-Origin', '*')
              ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
              ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found.'
            ], 404)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Exception $e) {
            \Log::error('Employee update error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Update failed due to a system error. Please try again.',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
    }

    // Authenticate employee using emp_id, email, or contact number
    public function authenticate(Request $request)
    {
        try {
            $request->validate([
                'identifier' => 'required|string', // Can be emp_id, email, or contact
                'contact' => 'required|string|digits:11' // Contact number for verification
            ]);

            $identifier = $request->identifier;
            $contact = $request->contact;

            // Find employee by emp_id, email, or contact number
            $employee = Employee::where(function($query) use ($identifier) {
                $query->where('emp_id', $identifier)
                      ->orWhere('email', $identifier)
                      ->orWhere('contact_number', $identifier);
            })->first();

            if (!$employee) {
                $response = response()->json([
                    'success' => false,
                    'message' => 'Employee not found. Please check your employee ID, email, or contact number.'
                ], 404);

                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            // Verify contact number matches
            if ($employee->contact_number !== $contact) {
                $response = response()->json([
                    'success' => false,
                    'message' => 'Contact number verification failed. Please check your contact number.'
                ], 401);

                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            // Authentication successful
            $response = response()->json([
                'success' => true,
                'message' => 'Authentication successful',
                'employee' => [
                    'id' => $employee->id,
                    'emp_id' => $employee->emp_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'middle_name' => $employee->middle_name,
                    'email' => $employee->email,
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'contact' => $employee->contact_number
                ]
            ]);

            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Employee authentication error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $response = response()->json([
                'success' => false,
                'message' => 'Authentication failed',
                'error' => $e->getMessage()
            ], 500);

            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    /**
     * Verify email with verification code
     */
    public function verifyEmail(Request $request)
    {
        try {
            $request->validate([
                'employee_id' => 'required|integer',
                'verification_code' => 'required|string|size:6'
            ]);

            $employee = Employee::find($request->employee_id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Check if already verified
            if ($employee->email_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already verified.',
                    'already_verified' => true
                ], 400)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Check if code expired
            if ($employee->verification_code_expires_at && Carbon::now()->gt($employee->verification_code_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification code has expired. Please request a new code.',
                    'code_expired' => true
                ], 400)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Check if max attempts reached
            if ($employee->verification_attempts >= 5) {
                // Delete the employee record after 5 failed attempts
                $employee->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum verification attempts reached. Registration has been cancelled. Please register again.',
                    'max_attempts_reached' => true
                ], 400)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Verify code
            if ($employee->email_verification_code !== $request->verification_code) {
                $employee->increment('verification_attempts');
                $remainingAttempts = 5 - $employee->verification_attempts;

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code. ' . ($remainingAttempts > 0 ? "You have {$remainingAttempts} attempt(s) remaining." : 'Maximum attempts reached.'),
                    'remaining_attempts' => $remainingAttempts,
                    'max_attempts_reached' => $remainingAttempts === 0
                ], 400)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Code is correct - verify email and complete registration
            $employee->update([
                'email_verified_at' => Carbon::now(),
                'status' => 'active',
                'email_verification_code' => null,
                'verification_code_expires_at' => null
            ]);

            // Generate QR code with employee data
            $qrData = [
                'type' => 'employee',
                'id' => $employee->id,
                'emp_id' => $employee->emp_id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'email' => $employee->email,
                'department' => $employee->department,
                'contact_number' => $employee->contact_number
            ];

            // Create QR code as SVG
            $qrCodeSvg = QrCode::format('svg')
                ->size(200)
                ->margin(2)
                ->generate(json_encode($qrData));

            // Save the SVG QR code
            $qrFileName = 'Employee_' . $employee->emp_id . '_' . $employee->first_name . '_' . $employee->last_name . '.svg';
            $qrPath = 'qr_codes/employees/' . $qrFileName;

            // Ensure qr_codes/employees directory exists
            if (!file_exists(public_path('qr_codes/employees'))) {
                mkdir(public_path('qr_codes/employees'), 0755, true);
            }

            // Save the SVG QR code
            file_put_contents(public_path($qrPath), $qrCodeSvg);

            // Update employee record with QR code information
            $employee->update([
                'qr_code_path' => $qrPath,
                'qr_code' => json_encode($qrData)
            ]);

            // Generate QR download URL
            $qrDownloadUrl = url("api/download-qr/employees/{$qrFileName}");

            // Send registration email with QR code and credentials
            try {
                Mail::to($employee->email)->send(new EmployeeRegistrationMail($employee, $qrDownloadUrl));
                \Log::info('Registration email sent successfully after verification', [
                    'employee_id' => $employee->id,
                    'email' => $employee->email
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send registration email after verification', [
                    'employee_id' => $employee->id,
                    'email' => $employee->email,
                    'error' => $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully! Your registration is complete. QR code and credentials have been sent to your email.',
                'employee' => [
                    'id' => $employee->id,
                    'emp_id' => $employee->emp_id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'email' => $employee->email,
                    'position' => $employee->position,
                    'department' => $employee->department,
                    'contact' => $employee->contact_number,
                    'qr_code_path' => $employee->qr_code_path,
                    'qr_code_data' => $qrData
                ],
                'qr_url' => url("api/qr-display/employees/{$qrFileName}"),
                'qr_download_url' => $qrDownloadUrl
            ], 200)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Exception $e) {
            \Log::error('Email verification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Verification failed due to a system error. Please try again.',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
    }

    /**
     * Resend verification code
     */
    public function resendVerificationCode(Request $request)
    {
        try {
            $request->validate([
                'employee_id' => 'required|integer'
            ]);

            $employee = Employee::find($request->employee_id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found.'
                ], 404)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Check if already verified
            if ($employee->email_verified_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already verified.',
                    'already_verified' => true
                ], 400)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            // Generate new verification code
            $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Update employee with new code
            $employee->update([
                'email_verification_code' => $verificationCode,
                'verification_code_expires_at' => Carbon::now()->addMinutes(15),
                'verification_attempts' => 0  // Reset attempts
            ]);

            // Send verification email
            try {
                Mail::to($employee->email)->send(new EmployeeVerificationMail($employee, $verificationCode));
                \Log::info('Verification code resent successfully', [
                    'employee_id' => $employee->id,
                    'email' => $employee->email
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to resend verification email', [
                    'employee_id' => $employee->id,
                    'email' => $employee->email,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to resend verification code. Please try again.',
                    'error' => 'Email service unavailable'
                ], 500)->header('Access-Control-Allow-Origin', '*')
                     ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                     ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            }

            return response()->json([
                'success' => true,
                'message' => 'Verification code has been resent to your email.'
            ], 200)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Exception $e) {
            \Log::error('Resend verification code error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to resend verification code. Please try again.',
                'error' => $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
    }

}
