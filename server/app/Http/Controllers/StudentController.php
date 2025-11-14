<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('Student registration request received', [
                'data' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            // Check for existing records across both students and employees tables
            $existingEmail = Student::where('email', $request->email)->exists() ||
                           \App\Models\Employee::where('email', $request->email)->exists();

            $existingContact = Student::where('contact_number', $request->contact)->exists() ||
                             \App\Models\Employee::where('contact_number', $request->contact)->exists();

            $existingStudentId = Student::where('student_id', $request->student_id)->exists();

            // Build custom validation errors
            $errors = [];
            if ($existingEmail) {
                $errors['email'] = ['This email address is already registered.'];
            }
            if ($existingContact) {
                $errors['contact'] = ['This contact number is already registered.'];
            }
            if ($existingStudentId) {
                $errors['studentId'] = ['This student ID is already taken.'];
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
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'email' => 'required|email',
                'student_id' => 'required|string',
                'course' => 'required|string|max:255',
                'year_level' => 'required|string|max:255',
                'contact' => 'required|string|digits:11'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Exception $e) {
            \Log::error('Student registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed due to a system error. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }

        // Create student record
        $student = Student::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'email' => $validated['email'],
            'student_id' => $validated['student_id'],
            'course' => $validated['course'],
            'year_level' => $validated['year_level'],
            'contact_number' => $validated['contact'],  // Map contact to contact_number
            'status' => 'active'   // Default status
        ]);

        // Generate QR code with student data
        $qrData = [
            'type' => 'student',
            'id' => $student->id,
            'student_id' => $student->student_id,
            'name' => $student->first_name . ' ' . $student->last_name,
            'email' => $student->email,
            'course' => $student->course,
            'year_level' => $student->year_level,
            'contact_number' => $student->contact_number
        ];

        // Create QR code as SVG (no external dependencies)
        $qrCodeSvg = QrCode::format('svg')
            ->size(200)
            ->margin(2)
            ->generate(json_encode($qrData));

        // Save the SVG QR code
        $qrFileName = 'Student_' . $student->student_id . '_' . $student->first_name . '_' . $student->last_name . '.svg';
        $qrPath = 'qr_codes/students/' . $qrFileName;

        // Ensure qr_codes/students directory exists
        if (!file_exists(public_path('qr_codes/students'))) {
            mkdir(public_path('qr_codes/students'), 0755, true);
        }

        // Save the SVG QR code
        file_put_contents(public_path($qrPath), $qrCodeSvg);

        // Update student record with QR code information
        $student->update([
            'qr_code_path' => $qrPath,
            'qr_code' => json_encode($qrData)  // Store QR data as JSON
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Student registered successfully!',
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'email' => $student->email,
                'course' => $student->course,
                'year_level' => $student->year_level,
                'contact' => $student->contact_number,  // Use contact_number field
                'qr_code_path' => $student->qr_code_path,
                'qr_code_data' => $qrData
            ],
            'qr_url' => url("api/qr-display/students/{$qrFileName}"),
            'qr_download_url' => url("api/download-qr/students/{$qrFileName}") // Download the SVG QR code
        ], 201)->header('Access-Control-Allow-Origin', '*')
             ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    // Live uniqueness checking for real-time validation
    public function checkUniqueness(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('Student uniqueness check request received', [
                'data' => $request->all(),
                'student_id' => $request->student_id,
                'email' => $request->email,
                'contact' => $request->contact
            ]);

            $response = [
                'studentIdExists' => false,
                'emailExists' => false,
                'contactExists' => false
            ];

            // Check student ID uniqueness
            if ($request->has('student_id') && $request->student_id) {
                $response['studentIdExists'] = Student::where('student_id', $request->student_id)->exists();
            }

            // Check email uniqueness across both students and employees
            if ($request->has('email') && $request->email) {
                $response['emailExists'] = Student::where('email', $request->email)->exists() ||
                                         \App\Models\Employee::where('email', $request->email)->exists();
            }

            // Check contact uniqueness across both students and employees
            if ($request->has('contact') && $request->contact) {
                $studentContactExists = Student::where('contact_number', $request->contact)->exists();
                $employeeContactExists = \App\Models\Employee::where('contact_number', $request->contact)->exists();
                $response['contactExists'] = $studentContactExists || $employeeContactExists;

                \Log::info('Contact uniqueness check', [
                    'contact' => $request->contact,
                    'studentContactExists' => $studentContactExists,
                    'employeeContactExists' => $employeeContactExists,
                    'finalResult' => $response['contactExists']
                ]);
            }

            \Log::info('Student uniqueness check response', $response);
            return response()->json($response)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            \Log::error('Student uniqueness check error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'studentIdExists' => false,
                'emailExists' => false,
                'contactExists' => false,
                'error' => 'Unable to check uniqueness at this time'
            ], 500);
        }
    }

    // Get QR code for an existing student
    public function getQRCode($id)
    {
        try {
            $student = Student::findOrFail($id);

            if (!$student->qr_code_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code not found for this student'
                ], 404);
            }

            // Extract filename from path
            $filename = basename($student->qr_code_path);

            return response()->json([
                'success' => true,
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'email' => $student->email,
                    'course' => $student->course,
                    'year_level' => $student->year_level,
                    'qr_code_data' => $student->qr_code ? json_decode($student->qr_code, true) : null
                ],
                'qr_url' => url("api/qr-display/students/{$filename}"),
                'qr_download_url' => url("api/download-qr/students/{$filename}")
            ])->header('Access-Control-Allow-Origin', '*')
              ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
              ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        } catch (\Exception $e) {
            \Log::error('Student QR code retrieval error', [
                'error' => $e->getMessage(),
                'student_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve QR code'
            ], 500);
        }
    }

    // List all students
    public function index(Request $request)
    {
        try {
            $students = Student::select([
                'id', 'first_name', 'last_name', 'middle_name',
                'email', 'student_id', 'course', 'year_level', 'contact_number',
                'qr_code_path', 'status', 'created_at'
            ])->get();

            // Add QR code URLs for students who have them
            $students = $students->map(function ($student) {
                if ($student->qr_code_path) {
                    $filename = basename($student->qr_code_path);
                    $student->qr_url = url("api/qr-display/students/{$filename}");
                    $student->qr_download_url = url("api/download-qr/students/{$filename}");
                    $student->has_qr_code = true;
                } else {
                    $student->qr_url = null;
                    $student->qr_download_url = null;
                    $student->has_qr_code = false;
                }
                return $student;
            });

            return response()->json($students);
        } catch (\Exception $e) {
            \Log::error('Students index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to fetch students',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Update student data
    public function update(Request $request, $id)
    {
        try {
            // Find the student
            $student = Student::findOrFail($id);

            // Check for existing records across both students and employees tables (excluding current student)
            $existingEmail = Student::where('email', $request->email)
                                  ->where('id', '!=', $id)
                                  ->exists() ||
                           \App\Models\Employee::where('email', $request->email)->exists();

            $existingContact = Student::where('contact_number', $request->contact_number)
                                    ->where('id', '!=', $id)
                                    ->exists() ||
                             \App\Models\Employee::where('contact_number', $request->contact_number)->exists();

            $existingStudentId = Student::where('student_id', $request->student_id)
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
            if ($existingStudentId) {
                $errors['student_id'] = ['This student ID is already taken.'];
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
                'student_id' => 'required|string',
                'course' => 'required|string|max:255',
                'year_level' => 'required|string|max:255',
                'contact_number' => 'required|string|digits:11',
                'status' => 'nullable|string|in:active,inactive'
            ]);

            // Update student record
            $student->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'email' => $validated['email'],
                'student_id' => $validated['student_id'],
                'course' => $validated['course'],
                'year_level' => $validated['year_level'],
                'contact_number' => $validated['contact_number'],
                'status' => $validated['status'] ?? 'active'
            ]);

            // Refresh the model to get updated data
            $student->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully!',
                'student' => [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'middle_name' => $student->middle_name,
                    'email' => $student->email,
                    'student_id' => $student->student_id,
                    'course' => $student->course,
                    'year_level' => $student->year_level,
                    'contact_number' => $student->contact_number,
                    'status' => $student->status,
                    'created_at' => $student->created_at
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
                'message' => 'Student not found.'
            ], 404)->header('Access-Control-Allow-Origin', '*')
                 ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        } catch (\Exception $e) {
            \Log::error('Student update error', [
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

    // Authenticate student using student_id, email, or contact number
    public function authenticate(Request $request)
    {
        try {
            $request->validate([
                'identifier' => 'required|string', // Can be student_id, email, or contact
                'contact' => 'required|string|digits:11' // Contact number for verification
            ]);

            $identifier = $request->identifier;
            $contact = $request->contact;

            // Find student by student_id, email, or contact number
            $student = Student::where(function($query) use ($identifier) {
                $query->where('student_id', $identifier)
                      ->orWhere('email', $identifier)
                      ->orWhere('contact_number', $identifier);
            })->first();

            if (!$student) {
                $response = response()->json([
                    'success' => false,
                    'message' => 'Student not found. Please check your student ID, email, or contact number.'
                ], 404);

                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            // Verify contact number matches
            if ($student->contact_number !== $contact) {
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
                'student' => [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'middle_name' => $student->middle_name,
                    'email' => $student->email,
                    'course' => $student->course,
                    'year_level' => $student->year_level,
                    'contact' => $student->contact_number
                ]
            ]);

            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Student authentication error', [
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

}
