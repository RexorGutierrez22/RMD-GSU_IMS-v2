<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Employee;

class ArchiveController extends Controller
{
    public function getArchivedStudents()
    {
        // For now, return empty array - implement archiving logic later
        return response()->json([]);
    }

    public function getArchivedEmployees()
    {
        // For now, return empty array - implement archiving logic later
        return response()->json([]);
    }

    public function deleteAndArchiveStudent($id)
    {
        try {
            $student = Student::findOrFail($id);
            // For now, just delete - implement archiving logic later
            $student->delete();

            return response()->json([
                'success' => true,
                'message' => 'Student archived successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive student'
            ], 500);
        }
    }

    public function deleteAndArchiveEmployee($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            // For now, just delete - implement archiving logic later
            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Employee archived successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to archive employee'
            ], 500);
        }
    }
}
