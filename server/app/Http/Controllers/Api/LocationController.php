<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLocation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class LocationController extends Controller
{
    /**
     * Get all locations
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Build cache key based on filters
            $activeOnly = $request->has('active_only') && $request->active_only;
            $cacheKey = 'locations:' . ($activeOnly ? 'active' : 'all');

            // Cache for 1 hour (3600 seconds) - locations don't change frequently
            $cacheDuration = 3600;

            $locations = Cache::remember($cacheKey, $cacheDuration, function () use ($activeOnly) {
                $query = InventoryLocation::query();

                // Filter by active status if requested
                if ($activeOnly) {
                    $query->active();
                }

                return $query->orderBy('name')->get();
            });

            return response()->json([
                'success' => true,
                'data' => $locations,
                'message' => 'Locations retrieved successfully'
            ]);

        } catch (\Exception $e) {
            // Fallback to database if cache fails - ensures system keeps working
            try {
                $query = InventoryLocation::query();
                if ($request->has('active_only') && $request->active_only) {
                    $query->active();
                }
                $locations = $query->orderBy('name')->get();

                return response()->json([
                    'success' => true,
                    'data' => $locations,
                    'message' => 'Locations retrieved successfully'
                ]);
            } catch (\Exception $fallbackError) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve locations',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    }

    /**
     * Get specific location
     */
    public function show(int $id): JsonResponse
    {
        try {
            $location = InventoryLocation::find($id);

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $location,
                'message' => 'Location retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new location
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:inventory_locations,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $location = InventoryLocation::create($request->all());

            // Invalidate cache when location is created
            Cache::forget('locations:all');
            Cache::forget('locations:active');

            return response()->json([
                'success' => true,
                'message' => 'Location created successfully',
                'data' => $location
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update location
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $location = InventoryLocation::find($id);

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Location not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:inventory_locations,name,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $location->update($request->all());

            // Invalidate cache when location is updated
            Cache::forget('locations:all');
            Cache::forget('locations:active');

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'data' => $location
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update location',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete location
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $location = InventoryLocation::find($id);

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location not found'
                ], 404);
            }

            // Check if location has items
            $itemCount = $location->items()->count();
            if ($itemCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete location. It has {$itemCount} items associated with it."
                ], 400);
            }

            $location->delete();

            // Invalidate cache when location is deleted
            Cache::forget('locations:all');
            Cache::forget('locations:active');

            return response()->json([
                'success' => true,
                'message' => 'Location deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete location',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
