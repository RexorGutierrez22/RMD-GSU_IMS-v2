<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Employee;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function getStats()
    {
        try {
            $totalStudents = Student::count();
            $totalEmployees = Employee::count();

            // For now, using mock data for inventory items and pending requests
            // These can be updated when inventory and borrowing models are created
            $totalItems = 320; // This would come from Inventory model
            $pendingRequests = 12; // This would come from BorrowRequest model with pending status

            return response()->json([
                'totalStudents' => $totalStudents,
                'totalEmployees' => $totalEmployees,
                'totalItems' => $totalItems,
                'pendingRequests' => $pendingRequests,
                'recentRegistrations' => [
                    'students' => Student::latest()->take(5)->get(['first_name', 'last_name', 'created_at']),
                    'employees' => Employee::latest()->take(5)->get(['first_name', 'last_name', 'created_at'])
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch dashboard statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getRecentActivity()
    {
        try {
            $activities = [];

            // Get recent student registrations
            $recentStudents = Student::latest()->take(3)->get();
            foreach ($recentStudents as $student) {
                $activities[] = [
                    'type' => 'student_registration',
                    'message' => "New student registered: {$student->first_name} {$student->last_name}",
                    'timestamp' => $student->created_at,
                    'icon' => 'user'
                ];
            }

            // Get recent employee registrations
            $recentEmployees = Employee::latest()->take(3)->get();
            foreach ($recentEmployees as $employee) {
                $activities[] = [
                    'type' => 'employee_registration',
                    'message' => "New employee registered: {$employee->first_name} {$employee->last_name}",
                    'timestamp' => $employee->created_at,
                    'icon' => 'users'
                ];
            }

            // Sort activities by timestamp
            usort($activities, function($a, $b) {
                return $b['timestamp'] <=> $a['timestamp'];
            });

            return response()->json([
                'activities' => array_slice($activities, 0, 10) // Return latest 10 activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch recent activity',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getStudentsCount()
    {
        try {
            // Add debugging
            \Log::info('Students count endpoint called');

            $count = Student::count();
            \Log::info('Students count: ' . $count);

            $response = response()->json([
                'count' => $count,
                'total' => $count,
                'debug' => 'Students count fetched successfully'
            ]);

            // Add CORS headers manually
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Students count error: ' . $e->getMessage());

            $response = response()->json([
                'error' => 'Failed to fetch students count',
                'message' => $e->getMessage(),
                'count' => 0
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getEmployeesCount()
    {
        try {
            // Add debugging
            \Log::info('Employees count endpoint called');

            $count = Employee::count();
            \Log::info('Employees count: ' . $count);

            $response = response()->json([
                'count' => $count,
                'total' => $count,
                'debug' => 'Employees count fetched successfully'
            ]);

            // Add CORS headers manually
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Employees count error: ' . $e->getMessage());

            $response = response()->json([
                'error' => 'Failed to fetch employees count',
                'message' => $e->getMessage(),
                'count' => 0
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getInventoryStats()
    {
        try {
            // Mock data for now - replace with actual inventory model when implemented
            return response()->json([
                'total_items' => 320,
                'borrowed_items' => 25,
                'low_stock_items' => 8,
                'available_items' => 295
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch inventory stats',
                'message' => $e->getMessage(),
                'total_items' => 0,
                'borrowed_items' => 0,
                'low_stock_items' => 0,
                'available_items' => 0
            ], 500);
        }
    }

    public function authenticateSuperAdmin(Request $request)
    {
        try {
            // Add more detailed logging
            \Log::info('=== SuperAdmin Authentication Debug ===');
            \Log::info('Request data: ', $request->all());

            $credentials = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            \Log::info('SuperAdmin authentication attempt', ['username' => $credentials['username']]);
            \Log::info('Looking for username in superadmin table...');

            // Check if superadmin table exists first
            if (!Schema::hasTable('superadmin')) {
                \Log::error('SuperAdmin table does not exist!');
                return response()->json([
                    'success' => false,
                    'message' => 'System configuration error: SuperAdmin table not found'
                ], 500);
            }

            // Direct database query for superadmin authentication
            $superAdmin = DB::table('superadmin')->where('username', $credentials['username'])->first();
            \Log::info('Database query result: ', $superAdmin ? ['found' => true, 'username' => $superAdmin->username] : ['found' => false]);

            if (!$superAdmin) {
                \Log::warning('SuperAdmin not found', ['username' => $credentials['username']]);

                // Check if there are any superadmin records at all
                $adminCount = DB::table('superadmin')->count();
                \Log::info('Total superadmin records in database: ' . $adminCount);

                $response = response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);

                // Add CORS headers
                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            // Check password
            \Log::info('Checking password for user: ' . $superAdmin->username);
            \Log::info('Password hash from DB: ' . substr($superAdmin->password, 0, 20) . '...');
            \Log::info('Input password: ' . $credentials['password']);

            if (!Hash::check($credentials['password'], $superAdmin->password)) {
                \Log::warning('SuperAdmin password mismatch', [
                    'username' => $credentials['username'],
                    'provided_password' => $credentials['password'],
                    'hash_from_db' => substr($superAdmin->password, 0, 20) . '...'
                ]);

                $response = response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);

                // Add CORS headers
                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            \Log::info('SuperAdmin authentication successful', ['username' => $credentials['username']]);

            // Authentication successful
            $response = response()->json([
                'success' => true,
                'message' => 'Authentication successful',
                'admin' => [
                    'id' => $superAdmin->id,
                    'username' => $superAdmin->username,
                    'full_name' => $superAdmin->full_name,
                    'email' => $superAdmin->email
                ]
            ]);

            // Add CORS headers
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('SuperAdmin authentication error', ['error' => $e->getMessage()]);

            $response = response()->json([
                'success' => false,
                'message' => 'Authentication failed',
                'error' => $e->getMessage()
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getAllStudents()
    {
        try {
            $students = Student::select([
                'id',
                'first_name',
                'last_name',
                'student_id',
                'email',
                'course',
                'year_level',
                'contact',
                'created_at'
            ])->get()->map(function ($student) {
                return [
                    'id' => 'STU-' . str_pad($student->id, 3, '0', STR_PAD_LEFT),
                    'firstName' => $student->first_name,
                    'lastName' => $student->last_name,
                    'studentId' => $student->student_id,
                    'email' => $student->email,
                    'course' => $student->course,
                    'yearLevel' => $student->year_level,
                    'contact' => $student->contact,
                    'status' => 'Active', // You can add this field to the database if needed
                    'registeredDate' => $student->created_at->toISOString()
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllEmployees()
    {
        try {
            // Check if category column exists in the employees table
            $columns = Schema::getColumnListing('employees');
            $selectColumns = [
                'id',
                'first_name',
                'last_name',
                'emp_id',
                'email',
                'position',
                'department',
                'contact',
                'created_at'
            ];

            // Add category only if it exists
            if (in_array('category', $columns)) {
                $selectColumns[] = 'category';
            }

            $employees = Employee::select($selectColumns)->get()->map(function ($employee) use ($columns) {
                $mappedEmployee = [
                    'id' => 'EMP-' . str_pad($employee->id, 3, '0', STR_PAD_LEFT),
                    'firstName' => $employee->first_name,
                    'lastName' => $employee->last_name,
                    'employeeId' => $employee->emp_id,
                    'email' => $employee->email,
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'contact' => $employee->contact,
                    'status' => 'Active', // You can add this field to the database if needed
                    'registeredDate' => $employee->created_at->toISOString()
                ];

                // Add category only if it exists
                if (in_array('category', $columns)) {
                    $mappedEmployee['category'] = $employee->category;
                } else {
                    // Default value if category doesn't exist
                    $mappedEmployee['category'] = 'Staff';
                }

                return $mappedEmployee;
            });

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employees',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
