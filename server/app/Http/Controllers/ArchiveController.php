<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Employee;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\SuperAdmin;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class ArchiveController extends Controller
{
    /**
     * Get archived students
     */
    public function getArchivedStudents(Request $request)
    {
        try {
            $query = Student::archived()
                ->with('archivedBy:id,full_name,username')
                ->select([
                    'id', 'first_name', 'last_name', 'middle_name', 'student_id',
                    'email', 'contact_number', 'course', 'year_level', 'status',
                    'created_at', 'updated_at', 'archived_at', 'auto_delete_at', 'archived_by'
                ])
                ->orderBy('archived_at', 'desc');

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = trim($request->search);
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%")
                      ->orWhere('student_id', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            // Pagination
            $perPage = min($request->get('per_page', 20), 100);
            $students = $query->paginate($perPage);

            $formattedStudents = $students->getCollection()->map(function($student) {
                return [
                    'id' => $student->id,
                    'name' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                    'student_id' => $student->student_id,
                    'email' => $student->email,
                    'contact_number' => $student->contact_number,
                    'course' => $student->course,
                    'year_level' => $student->year_level,
                    'status' => $student->status,
                    'archived_at' => $student->archived_at->toDateTimeString(),
                    'auto_delete_at' => $student->auto_delete_at->toDateTimeString(),
                    'days_until_auto_delete' => $student->getDaysUntilAutoDelete(),
                    'archived_by' => $student->archivedBy ? [
                        'id' => $student->archivedBy->id,
                        'name' => $student->archivedBy->full_name ?? $student->archivedBy->username ?? 'Unknown'
                    ] : null
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedStudents,
                'pagination' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                    'from' => $students->firstItem(),
                    'to' => $students->lastItem()
                ],
                'message' => 'Archived students retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving archived students:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve archived students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get archived employees
     */
    public function getArchivedEmployees(Request $request)
    {
        try {
            $query = Employee::archived()
                ->with('archivedBy:id,full_name,username')
                ->select([
                    'id', 'first_name', 'last_name', 'middle_name', 'emp_id',
                    'email', 'contact_number', 'position', 'department', 'status',
                    'created_at', 'updated_at', 'archived_at', 'auto_delete_at', 'archived_by'
                ])
                ->orderBy('archived_at', 'desc');

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = trim($request->search);
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'LIKE', "%{$search}%")
                      ->orWhere('last_name', 'LIKE', "%{$search}%")
                      ->orWhere('emp_id', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            // Pagination
            $perPage = min($request->get('per_page', 20), 100);
            $employees = $query->paginate($perPage);

            $formattedEmployees = $employees->getCollection()->map(function($employee) {
                return [
                    'id' => $employee->id,
                    'name' => trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}"),
                    'emp_id' => $employee->emp_id,
                    'email' => $employee->email,
                    'contact_number' => $employee->contact_number,
                    'position' => $employee->position,
                    'department' => $employee->department,
                    'status' => $employee->status,
                    'archived_at' => $employee->archived_at->toDateTimeString(),
                    'auto_delete_at' => $employee->auto_delete_at->toDateTimeString(),
                    'days_until_auto_delete' => $employee->getDaysUntilAutoDelete(),
                    'archived_by' => $employee->archivedBy ? [
                        'id' => $employee->archivedBy->id,
                        'name' => $employee->archivedBy->full_name ?? $employee->archivedBy->username ?? 'Unknown'
                    ] : null
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedEmployees,
                'pagination' => [
                    'current_page' => $employees->currentPage(),
                    'last_page' => $employees->lastPage(),
                    'per_page' => $employees->perPage(),
                    'total' => $employees->total(),
                    'from' => $employees->firstItem(),
                    'to' => $employees->lastItem()
                ],
                'message' => 'Archived employees retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving archived employees:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve archived employees',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive student (instead of permanent deletion)
     */
    public function deleteAndArchiveStudent(Request $request, $id)
    {
        try {
            $student = Student::findOrFail($id);

            // Check if already archived
            if ($student->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is already archived'
                ], 400);
            }

            // Get student info for logging
            $studentName = trim("{$student->first_name} {$student->middle_name} {$student->last_name}");
            $studentId = $student->student_id;

            // Get authenticated admin/staff user
            $user = $request->user();
            $adminName = 'System';
            $adminId = null;

            // Log for debugging
            Log::info('Archive student - Authentication check', [
                'user_type' => $user ? get_class($user) : 'null',
                'user_id' => $user ? $user->id : null,
                'has_token' => !empty($request->bearerToken()),
            ]);

            if ($user) {
                if ($user instanceof Admin) {
                    $adminName = $user->full_name ?? $user->username ?? 'Admin';
                    $adminId = $user->id;
                    Log::info('Admin authenticated', ['admin_id' => $adminId, 'admin_name' => $adminName]);
                } elseif ($user instanceof SuperAdmin) {
                    $adminName = $user->full_name ?? $user->username ?? 'Super Admin';
                    // SuperAdmin ID can't be stored in archived_by (FK to admin table)
                    // So we'll store null but log the SuperAdmin info
                    $adminId = null;
                    Log::info('SuperAdmin authenticated (archived_by will be null)', [
                        'superadmin_id' => $user->id,
                        'superadmin_name' => $adminName
                    ]);
                }
            } else {
                // Try to get user from token manually
                $token = $request->bearerToken();
                if ($token) {
                    // Check if it's a Sanctum token
                    $accessToken = PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable) {
                        $user = $accessToken->tokenable;
                        if ($user instanceof Admin) {
                            $adminName = $user->full_name ?? $user->username ?? 'Admin';
                            $adminId = $user->id;
                            Log::info('Admin authenticated via manual token lookup', [
                                'admin_id' => $adminId,
                                'admin_name' => $adminName
                            ]);
                        }
                    }
                }
                Log::warning('No authenticated user found for archive operation');
            }

            // Archive the student (sets archived_at and auto_delete_at)
            // Note: We don't delete QR code files when archiving - they'll be deleted on permanent deletion
            $student->archive($adminId);

            // Create activity log
            ActivityLog::log('student_archived', "Student archived: {$studentName} (ID: {$studentId}) - Auto-delete in 1 month", [
                'category' => 'students',
                'student_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'student_name' => $studentName,
                    'student_id' => $studentId,
                    'archived_at' => $student->archived_at->toDateTimeString(),
                    'auto_delete_at' => $student->auto_delete_at->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student archived successfully. It will be automatically deleted after 1 month if not restored.',
                'data' => [
                    'archived_at' => $student->archived_at->toDateTimeString(),
                    'auto_delete_at' => $student->auto_delete_at->toDateTimeString(),
                    'days_until_auto_delete' => $student->getDaysUntilAutoDelete()
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Student not found for archiving', ['student_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error archiving student', [
                'student_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to archive student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive employee (instead of permanent deletion)
     */
    public function deleteAndArchiveEmployee(Request $request, $id)
    {
        try {
            $employee = Employee::findOrFail($id);

            // Check if already archived
            if ($employee->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee is already archived'
                ], 400);
            }

            // Get employee info for logging
            $employeeName = trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}");
            $empId = $employee->emp_id;

            // Get authenticated admin/staff user
            $user = $request->user();
            $adminName = 'System';
            $adminId = null;

            // Log for debugging
            Log::info('Archive employee - Authentication check', [
                'user_type' => $user ? get_class($user) : 'null',
                'user_id' => $user ? $user->id : null,
                'has_token' => !empty($request->bearerToken()),
            ]);

            if ($user) {
                if ($user instanceof Admin) {
                    $adminName = $user->full_name ?? $user->username ?? 'Admin';
                    $adminId = $user->id;
                    Log::info('Admin authenticated', ['admin_id' => $adminId, 'admin_name' => $adminName]);
                } elseif ($user instanceof SuperAdmin) {
                    $adminName = $user->full_name ?? $user->username ?? 'Super Admin';
                    // SuperAdmin ID can't be stored in archived_by (FK to admin table)
                    // So we'll store null but log the SuperAdmin info
                    $adminId = null;
                    Log::info('SuperAdmin authenticated (archived_by will be null)', [
                        'superadmin_id' => $user->id,
                        'superadmin_name' => $adminName
                    ]);
                }
            } else {
                // Try to get user from token manually
                $token = $request->bearerToken();
                if ($token) {
                    // Check if it's a Sanctum token
                    $accessToken = PersonalAccessToken::findToken($token);
                    if ($accessToken && $accessToken->tokenable) {
                        $user = $accessToken->tokenable;
                        if ($user instanceof Admin) {
                            $adminName = $user->full_name ?? $user->username ?? 'Admin';
                            $adminId = $user->id;
                            Log::info('Admin authenticated via manual token lookup', [
                                'admin_id' => $adminId,
                                'admin_name' => $adminName
                            ]);
                        }
                    }
                }
                Log::warning('No authenticated user found for archive operation');
            }

            // Archive the employee (sets archived_at and auto_delete_at)
            // Note: We don't delete QR code files when archiving - they'll be deleted on permanent deletion
            $employee->archive($adminId);

            // Create activity log
            ActivityLog::log('employee_archived', "Employee archived: {$employeeName} (ID: {$empId}) - Auto-delete in 1 month", [
                'category' => 'employees',
                'employee_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'employee_name' => $employeeName,
                    'emp_id' => $empId,
                    'archived_at' => $employee->archived_at->toDateTimeString(),
                    'auto_delete_at' => $employee->auto_delete_at->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Employee archived successfully. It will be automatically deleted after 1 month if not restored.',
                'data' => [
                    'archived_at' => $employee->archived_at->toDateTimeString(),
                    'auto_delete_at' => $employee->auto_delete_at->toDateTimeString(),
                    'days_until_auto_delete' => $employee->getDaysUntilAutoDelete()
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('Employee not found for archiving', ['employee_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Employee not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error archiving employee', [
                'employee_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to archive employee: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore archived student
     */
    public function restoreStudent(Request $request, $id)
    {
        try {
            $student = Student::withTrashed()->findOrFail($id);

            if (!$student->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is not archived'
                ], 400);
            }

            $studentName = trim("{$student->first_name} {$student->middle_name} {$student->last_name}");

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Restore from archive
            $student->restoreFromArchive();

            // Create activity log
            ActivityLog::log('student_restored', "Student restored from archive: {$studentName} (ID: {$student->student_id})", [
                'category' => 'students',
                'student_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'student_name' => $studentName,
                    'student_id' => $student->student_id,
                    'restored_at' => now()->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student restored successfully',
                'data' => [
                    'id' => $student->id,
                    'name' => $studentName,
                    'student_id' => $student->student_id
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error restoring student:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'student_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore archived employee
     */
    public function restoreEmployee(Request $request, $id)
    {
        try {
            $employee = Employee::withTrashed()->findOrFail($id);

            if (!$employee->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee is not archived'
                ], 400);
            }

            $employeeName = trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}");

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Restore from archive
            $employee->restoreFromArchive();

            // Create activity log
            ActivityLog::log('employee_restored', "Employee restored from archive: {$employeeName} (ID: {$employee->emp_id})", [
                'category' => 'employees',
                'employee_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'employee_name' => $employeeName,
                    'emp_id' => $employee->emp_id,
                    'restored_at' => now()->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Employee restored successfully',
                'data' => [
                    'id' => $employee->id,
                    'name' => $employeeName,
                    'emp_id' => $employee->emp_id
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error restoring employee:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'employee_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore employee',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
