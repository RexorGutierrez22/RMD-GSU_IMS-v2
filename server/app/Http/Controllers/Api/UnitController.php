<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryUnit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class UnitController extends Controller
{
    /**
     * Get all units
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Build cache key based on filters
            $activeOnly = $request->has('active_only') && $request->active_only;
            $cacheKey = 'units:' . ($activeOnly ? 'active' : 'all');

            // Cache for 1 hour (3600 seconds) - units don't change frequently
            $cacheDuration = 3600;

            $units = Cache::remember($cacheKey, $cacheDuration, function () use ($activeOnly) {
                $query = InventoryUnit::query();

                // Filter by active status if requested
                if ($activeOnly) {
                    $query->active();
                }

                return $query->orderBy('name')->get();
            });

            return response()->json([
                'success' => true,
                'data' => $units,
                'message' => 'Units retrieved successfully'
            ]);

        } catch (\Exception $e) {
            // Fallback to database if cache fails - ensures system keeps working
            try {
                $query = InventoryUnit::query();
                if ($request->has('active_only') && $request->active_only) {
                    $query->active();
                }
                $units = $query->orderBy('name')->get();

                return response()->json([
                    'success' => true,
                    'data' => $units,
                    'message' => 'Units retrieved successfully'
                ]);
            } catch (\Exception $fallbackError) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve units',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    }

    /**
     * Get specific unit
     */
    public function show(int $id): JsonResponse
    {
        try {
            $unit = InventoryUnit::find($id);

            if (!$unit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unit not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $unit,
                'message' => 'Unit retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new unit
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:inventory_units,name',
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
            $unit = InventoryUnit::create($request->all());

            // Invalidate cache when unit is created
            Cache::forget('units:all');
            Cache::forget('units:active');

            return response()->json([
                'success' => true,
                'message' => 'Unit created successfully',
                'data' => $unit
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update unit
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $unit = InventoryUnit::find($id);

        if (!$unit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:inventory_units,name,' . $id,
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
            $unit->update($request->all());

            // Invalidate cache when unit is updated
            Cache::forget('units:all');
            Cache::forget('units:active');

            return response()->json([
                'success' => true,
                'message' => 'Unit updated successfully',
                'data' => $unit
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete unit
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $unit = InventoryUnit::find($id);

            if (!$unit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unit not found'
                ], 404);
            }

            // Check if unit is being used by any inventory items
            $itemsUsingUnit = \App\Models\InventoryItem::where('unit', $unit->name)->count();

            if ($itemsUsingUnit > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete unit. It is currently being used by {$itemsUsingUnit} inventory item(s).",
                    'items_count' => $itemsUsingUnit
                ], 422);
            }

            $unit->delete();

            // Invalidate cache when unit is deleted
            Cache::forget('units:all');
            Cache::forget('units:active');

            return response()->json([
                'success' => true,
                'message' => 'Unit deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

