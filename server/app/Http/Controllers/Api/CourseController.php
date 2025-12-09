<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CourseController extends Controller
{
    /**
     * Get all courses
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Handle active_only parameter (can be string "true" or boolean)
            $activeOnly = $request->has('active_only') && (
                $request->active_only === true ||
                $request->active_only === 'true' ||
                $request->active_only === '1'
            );
            $cacheKey = 'courses:' . ($activeOnly ? 'active' : 'all');

            $courses = Cache::remember($cacheKey, 3600, function () use ($activeOnly) {
                $query = Course::query();

                if ($activeOnly) {
                    $query->active();
                }

                // Order by college then by name (simpler approach)
                return $query->orderBy('college', 'asc')
                             ->orderBy('name', 'asc')
                             ->get();
            });

            return response()->json([
                'success' => true,
                'data' => $courses,
                'message' => 'Courses retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('CourseController index error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            try {
                $query = Course::query();
                if ($activeOnly) {
                    $query->active();
                }
                $courses = $query->orderBy('college', 'asc')
                                 ->orderBy('name', 'asc')
                                 ->get();

                return response()->json([
                    'success' => true,
                    'data' => $courses,
                    'message' => 'Courses retrieved successfully'
                ]);
            } catch (\Exception $fallbackError) {
                Log::error('CourseController fallback error', [
                    'error' => $fallbackError->getMessage(),
                    'trace' => $fallbackError->getTraceAsString()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve courses',
                    'error' => $e->getMessage(),
                    'fallback_error' => $fallbackError->getMessage()
                ], 500);
            }
        }
    }

    /**
     * Get specific course
     */
    public function show(int $id): JsonResponse
    {
        try {
            $course = Course::find($id);

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $course,
                'message' => 'Course retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new course
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'nullable|string|max:50|unique:courses,code',
            'name' => 'required|string|max:255|unique:courses,name',
            'college' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $course = Course::create([
                'code' => $request->code,
                'name' => $request->name,
                'college' => $request->college,
                'is_active' => $request->has('is_active') ? $request->is_active : true,
            ]);

            // Clear cache
            Cache::forget('courses:all');
            Cache::forget('courses:active');

            return response()->json([
                'success' => true,
                'data' => $course,
                'message' => 'Course created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a course
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $course = Course::find($id);

        if (!$course) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'nullable|string|max:50|unique:courses,code,' . $id,
            'name' => 'required|string|max:255|unique:courses,name,' . $id,
            'college' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $course->update([
                'code' => $request->code ?? $course->code,
                'name' => $request->name,
                'college' => $request->college ?? $course->college,
                'is_active' => $request->has('is_active') ? $request->is_active : $course->is_active,
            ]);

            // Clear cache
            Cache::forget('courses:all');
            Cache::forget('courses:active');

            return response()->json([
                'success' => true,
                'data' => $course,
                'message' => 'Course updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a course
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $course = Course::find($id);

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Check if course is being used by any students
            $studentCount = Student::where('course', $course->name)->count();
            if ($studentCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete course. It is currently being used by {$studentCount} student(s)."
                ], 409);
            }

            $course->delete();

            // Clear cache
            Cache::forget('courses:all');
            Cache::forget('courses:active');

            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
