<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    /**
     * Get all inventory items with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InventoryItem::query();

            // Category filter
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            // Check if pagination is needed
            if ($request->has('no_pagination') && $request->no_pagination == 'true') {
                $items = $query->orderBy('name')->get();

                // Format items for frontend
                $formattedItems = $items->map(function($item) {
                    return $this->formatItemForFrontend($item);
                });

                return response()->json([
                    'success' => true,
                    'data' => $formattedItems,
                    'message' => 'Inventory items retrieved successfully'
                ]);
            }

            $items = $query->orderBy('name')
                          ->paginate($request->get('per_page', 20));

            // Format items for frontend
            $formattedItems = $items->getCollection()->map(function($item) {
                return $this->formatItemForFrontend($item);
            });

            $items->setCollection($formattedItems);

            return response()->json([
                'success' => true,
                'data' => $items,
                'message' => 'Inventory items retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific inventory item
     */
    public function show(int $id): JsonResponse
    {
        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatItemForFrontend($item),
                'message' => 'Inventory item retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new inventory item
     */
    public function store(Request $request): JsonResponse
    {
        // Map frontend fields to database fields
        $mappedData = $this->mapFrontendToDatabase($request->all());

        $validator = Validator::make($mappedData, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'total_quantity' => 'required|integer|min:1',
            'type' => 'required|in:usable,consumable',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'unit' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $availableQty = $mappedData['total_quantity'];

            // Use AI-powered status calculation (30% threshold logic)
            $status = $this->calculateStatus($availableQty, $mappedData['total_quantity']);

            $item = InventoryItem::create(array_merge($mappedData, [
                'available_quantity' => $availableQty,
                'status' => $status
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Inventory item created successfully',
                'data' => $this->formatItemForFrontend($item)
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update inventory item
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // Debug: Log incoming data
        \Log::info('Update request data:', $request->all());

        // Map frontend fields to database fields
        $mappedData = $this->mapFrontendToDatabase($request->all());

        // Debug: Log mapped data
        \Log::info('Mapped data:', $mappedData);

        $validator = Validator::make($mappedData, [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|required|string|max:100',
            'total_quantity' => 'sometimes|required|integer|min:1',
            'type' => 'sometimes|required|in:usable,consumable',
            'size' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'unit' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            // Handle quantity adjustments if provided
            if (isset($request->quantityAdjustment) && isset($request->adjustmentType)) {
                $adjustment = (int)$request->quantityAdjustment;
                $type = $request->adjustmentType;

                if ($type === 'add') {
                    $mappedData['available_quantity'] = $item->available_quantity + $adjustment;
                    // Also increase total_quantity if adding stock
                    $mappedData['total_quantity'] = $item->total_quantity + $adjustment;
                } elseif ($type === 'subtract') {
                    $newAvailable = $item->available_quantity - $adjustment;
                    // Ensure available quantity doesn't go below 0
                    $mappedData['available_quantity'] = max(0, $newAvailable);
                    // Keep total_quantity the same when subtracting (represents consumed items)
                }
            } elseif (isset($mappedData['total_quantity'])) {
                // Only update available_quantity if no quantity adjustment is being made
                // and if this is a direct total_quantity update
                if (!isset($request->quantityAdjustment)) {
                    $mappedData['available_quantity'] = $mappedData['total_quantity'];
                }
            }

            // ALWAYS recalculate status based on available quantity (AI feature - 30% threshold)
            $currentAvailable = $mappedData['available_quantity'] ?? $item->available_quantity;
            $currentTotal = $mappedData['total_quantity'] ?? $item->total_quantity;

            // Remove any status from request data - it should NOT be user-editable
            unset($mappedData['status']);

            // Calculate the correct status based on quantity
            $mappedData['status'] = $this->calculateStatus($currentAvailable, $currentTotal);

            // Debug: Log what we're about to save
            \Log::info('About to update with data:', $mappedData);

            $item->update($mappedData);

            // Get fresh data from database
            $freshItem = $item->fresh();

            // Debug: Log what was saved
            \Log::info('After update - type in DB:', ['type' => $freshItem->type]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item updated successfully',
                'data' => $this->formatItemForFrontend($freshItem)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete inventory item
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventory item deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate automated status based on quantity percentage
     * AI Feature: Helps admin identify items needing restock
     *
     * @return string Database enum value ('available', 'low stock', 'out of stock')
     */
    private function calculateStatus(int $availableQuantity, int $totalQuantity): string
    {
        if ($availableQuantity == 0) {
            return 'out of stock';
        }

        // Calculate percentage
        $percentage = ($availableQuantity / $totalQuantity) * 100;

        if ($percentage < 30) {
            // Low Stock (below 30% threshold) - Alert admin to restock
            return 'low stock';
        }

        // Available (30% or more)
        return 'available';
    }

    /**
     * Map frontend fields to database fields
     */
    private function mapFrontendToDatabase(array $data): array
    {
        $mapped = [];

        // Direct mappings
        if (isset($data['itemName'])) $mapped['name'] = $data['itemName'];
        if (isset($data['name'])) $mapped['name'] = $data['name'];
        if (isset($data['specification'])) $mapped['description'] = $data['specification'];
        if (isset($data['description'])) $mapped['description'] = $data['description'];
        if (isset($data['totalQuantity'])) $mapped['total_quantity'] = $data['totalQuantity'];
        if (isset($data['total_quantity'])) $mapped['total_quantity'] = $data['total_quantity'];

        // Quality/Type mapping - quality takes precedence over type
        if (isset($data['type']) && !isset($data['quality'])) {
            $mapped['type'] = $data['type'];
        }
        if (isset($data['quality'])) {
            $mapped['type'] = strtolower($data['quality']);
        }

        // Direct field copies
        $directFields = ['category', 'location', 'size', 'color', 'unit'];
        foreach ($directFields as $field) {
            if (isset($data[$field])) $mapped[$field] = $data[$field];
        }

        return $mapped;
    }

    /**
     * Format item for frontend consumption
     */
    private function formatItemForFrontend($item): array
    {
        return [
            'id' => $item->id,
            'formatted_id' => $item->formatted_id,
            'display_id' => $item->display_id,
            'itemName' => $item->name,
            'name' => $item->name,
            'specification' => $item->description,
            'description' => $item->description,
            'size' => $item->size,
            'color' => $item->color,
            'quantity' => $item->available_quantity,
            'available_quantity' => $item->available_quantity,
            'totalQuantity' => $item->total_quantity,
            'total_quantity' => $item->total_quantity,
            'unit' => $item->unit,
            'location' => $item->location,
            'category' => $item->category,
            'quality' => ucfirst($item->type),
            'type' => $item->type,
            'status' => $item->status,
            'dateAdded' => $item->created_at->format('Y-m-d'),
            'isAvailable' => $item->available_quantity > 0,
            'created_at' => $item->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $item->updated_at->format('Y-m-d H:i:s')
        ];
    }
}
