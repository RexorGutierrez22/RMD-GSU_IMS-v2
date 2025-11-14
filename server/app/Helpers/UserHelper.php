<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Student;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class UserHelper
{
    /**
     * Find user by QR code across all tables (students, employees, users)
     * Searches in order: Students → Employees → Users
     *
     * @param string $qrCode The QR code to search for
     * @return array|null ['user' => Model, 'type' => 'student'|'employee'|'user', 'id_number' => string] or null if not found
     */
    public static function findUserByQrCode(string $qrCode): ?array
    {
        Log::info('🔍 UserHelper::findUserByQrCode called', ['qr_code' => $qrCode]);

        $user = null;
        $userType = null;
        $idNumber = null;

        // Try to decode as JSON first (for structured QR codes)
        $decodedQr = json_decode($qrCode, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decodedQr)) {
            Log::info('📋 QR code is JSON format', ['decoded' => $decodedQr]);

            // Handle Student JSON format
            if (isset($decodedQr['type']) && $decodedQr['type'] === 'student') {
                $studentId = $decodedQr['student_id'] ?? null;
                if ($studentId) {
                    $student = Student::where('student_id', $studentId)->first();
                    if ($student) {
                        Log::info('✅ Found student by JSON student_id', ['id' => $student->id]);
                        return [
                            'user' => $student,
                            'type' => 'student',
                            'id_number' => $student->student_id
                        ];
                    }
                }
            }

            // Handle Employee JSON format
            if (isset($decodedQr['type']) && $decodedQr['type'] === 'employee') {
                $empId = $decodedQr['emp_id'] ?? null;
                if ($empId) {
                    $employee = Employee::where('emp_id', $empId)->first();
                    if ($employee) {
                        Log::info('✅ Found employee by JSON emp_id', ['id' => $employee->id]);
                        return [
                            'user' => $employee,
                            'type' => 'employee',
                            'id_number' => $employee->emp_id
                        ];
                    } else {
                        Log::warning('❌ Employee NOT found in database', ['emp_id' => $empId]);
                    }
                } else {
                    Log::warning('❌ No emp_id in QR code JSON');
                }
            }

            // Fallback: Try student_id field without type
            if (isset($decodedQr['student_id'])) {
                $student = Student::where('student_id', $decodedQr['student_id'])->first();
                if ($student) {
                    Log::info('✅ Found student by JSON student_id (fallback)', ['id' => $student->id]);
                    return [
                        'user' => $student,
                        'type' => 'student',
                        'id_number' => $student->student_id
                    ];
                }
            }

            // Fallback: Try emp_id field without type
            if (isset($decodedQr['emp_id'])) {
                $empId = $decodedQr['emp_id'];
                $employee = Employee::where('emp_id', $empId)->first();
                if ($employee) {
                    Log::info('✅ Found employee by JSON emp_id (fallback)', ['id' => $employee->id]);
                    return [
                        'user' => $employee,
                        'type' => 'employee',
                        'id_number' => $employee->emp_id
                    ];
                } else {
                    Log::warning('❌ Employee NOT found in database (fallback)', ['emp_id' => $empId]);
                }
            }

            // Fallback: Try id_number in users table
            if (isset($decodedQr['id_number'])) {
                $userRecord = User::where('id_number', $decodedQr['id_number'])->first();
                if ($userRecord) {
                    Log::info('✅ Found user by JSON id_number', ['id' => $userRecord->id]);
                    return [
                        'user' => $userRecord,
                        'type' => 'user',
                        'id_number' => $userRecord->id_number
                    ];
                }
            }
        }

        // Simple string format - search all tables by qr_code field
        Log::info('🔤 QR code is simple string format, searching all tables...');

        // 1. Check students table first (PRIORITY 1)
        $student = Student::where('qr_code', $qrCode)->first();
        if ($student) {
            Log::info('✅ Found student by qr_code string', ['id' => $student->id, 'student_id' => $student->student_id]);
            return [
                'user' => $student,
                'type' => 'student',
                'id_number' => $student->student_id
            ];
        }

        // 2. Check employees table second (PRIORITY 2)
        $employee = Employee::where('qr_code', $qrCode)->first();
        if ($employee) {
            Log::info('✅ Found employee by qr_code string', ['id' => $employee->id, 'emp_id' => $employee->emp_id]);
            return [
                'user' => $employee,
                'type' => 'employee',
                'id_number' => $employee->emp_id
            ];
        }

        // 3. Check users table last (PRIORITY 3)
        $userRecord = User::where('qr_code', $qrCode)->first();
        if ($userRecord) {
            Log::info('✅ Found user by qr_code string', ['id' => $userRecord->id, 'id_number' => $userRecord->id_number]);
            return [
                'user' => $userRecord,
                'type' => 'user',
                'id_number' => $userRecord->id_number
            ];
        }

        Log::warning('❌ User not found in any table', ['qr_code' => $qrCode]);
        return null;
    }

    /**
     * Get borrowed items for any user type
     *
     * @param mixed $user The user model (Student, Employee, or User)
     * @param string $userType The type of user ('student', 'employee', or 'user')
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getBorrowedItemsForUser($user, string $userType)
    {
        Log::info('📦 Getting borrowed items', [
            'user_id' => $user->id,
            'user_type' => $userType
        ]);

        $borrowedItems = \App\Models\BorrowTransaction::where('borrower_type', $userType)
            ->where('borrower_id', $user->id)
            ->where('status', 'borrowed')
            ->with(['inventoryItem'])
            ->get();

        Log::info('📋 Found borrowed items', ['count' => $borrowedItems->count()]);

        return $borrowedItems;
    }

    /**
     * Format user data for API response
     *
     * @param mixed $user The user model
     * @param string $userType The type of user
     * @return array Formatted user data
     */
    public static function formatUserData($user, string $userType): array
    {
        $baseData = [
            'id' => $user->id,
            'type' => ucfirst($userType),
            'status' => $user->status ?? 'active',
            'qr_code' => $user->qr_code ?? null,
        ];

        // Type-specific fields
        if ($userType === 'student') {
            return array_merge($baseData, [
                'full_name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'firstName' => $user->first_name ?? '',
                'lastName' => $user->last_name ?? '',
                'id_number' => $user->student_id ?? '',
                'email' => $user->email ?? '',
                'contact_number' => $user->contact_number ?? '',
                'course' => $user->course ?? '',
                'year_level' => $user->year_level ?? '',
                'department' => 'Student',
            ]);
        } elseif ($userType === 'employee') {
            return array_merge($baseData, [
                'full_name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'firstName' => $user->first_name ?? '',
                'lastName' => $user->last_name ?? '',
                'id_number' => $user->emp_id ?? $user->employee_id ?? '',
                'email' => $user->email ?? '',
                'contact_number' => $user->contact_number ?? '',
                'position' => $user->position ?? '',
                'department' => $user->department ?? '',
            ]);
        } else {
            // User table format
            return array_merge($baseData, [
                'full_name' => $user->full_name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'firstName' => $user->first_name ?? '',
                'lastName' => $user->last_name ?? '',
                'id_number' => $user->id_number ?? '',
                'email' => $user->email ?? '',
                'contact_number' => $user->contact_number ?? '',
                'course' => $user->course ?? '',
                'year_level' => $user->year_level ?? '',
                'department' => $user->department ?? '',
            ]);
        }
    }

    /**
     * Check if user is active and allowed to borrow/return
     *
     * @param mixed $user The user model
     * @return bool
     */
    public static function isUserActive($user): bool
    {
        $status = $user->status ?? 'active';
        return in_array(strtolower($status), ['active', 'approved']);
    }
}
