<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\ActivityLog;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    /**
     * Get all inventory items with optional filtering
     * Optimized for performance with caching and efficient queries
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Build cache key based on request parameters
            $cacheKey = 'inventory:list:' . md5(json_encode([
                'category' => $request->get('category'),
                'status' => $request->get('status'),
                'search' => $request->get('search'),
                'page' => $request->get('page', 1),
                'per_page' => $request->get('per_page', 20),
                'no_pagination' => $request->get('no_pagination')
            ]));

            // Check cache first (cache for 5 minutes)
            $cached = Cache::get($cacheKey);
            if ($cached && !$request->has('no_cache')) {
                return response()->json($cached);
            }

            // Optimize query: select only needed columns
            // Exclude archived items by default (unless specifically requested)
            $query = InventoryItem::select([
                'id', 'name', 'category', 'description', 'total_quantity',
                'available_quantity', 'type', 'status', 'location', 'size',
                'color', 'unit', 'low_stock_threshold', 'image_path',
                'created_at', 'updated_at', 'archived_at', 'auto_delete_at'
            ])->notArchived(); // Exclude archived items by default

            // Category filter
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Search filter - use indexed column first
            if ($request->has('search') && !empty($request->search)) {
                $search = trim($request->search);
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            // Check if pagination is needed
            if ($request->has('no_pagination') && $request->no_pagination == 'true') {
                // Limit to max 1000 items even without pagination to prevent memory issues
                $items = $query->orderBy('name')
                              ->limit(1000)
                              ->get();

                // Format items for frontend (defer Storage URL generation)
                $formattedItems = $items->map(function($item) {
                    return $this->formatItemForFrontend($item, false); // false = don't generate image URLs
                });

                $response = [
                    'success' => true,
                    'data' => $formattedItems,
                    'message' => 'Inventory items retrieved successfully'
                ];

                // Cache for 2 minutes (shorter for no_pagination since it's more dynamic)
                Cache::put($cacheKey, $response, 120);

                return response()->json($response);
            }

            // Use pagination (default 20 items per page)
            $perPage = min($request->get('per_page', 20), 100); // Max 100 items per page
            $items = $query->orderBy('name')
                          ->paginate($perPage);

            // Format items for frontend (defer Storage URL generation)
            $formattedItems = $items->getCollection()->map(function($item) {
                return $this->formatItemForFrontend($item, false); // false = don't generate image URLs
            });

            $items->setCollection($formattedItems);

            $response = [
                'success' => true,
                'data' => $items,
                'message' => 'Inventory items retrieved successfully'
            ];

            // Cache for 5 minutes
            Cache::put($cacheKey, $response, 300);

            return response()->json($response);

        } catch (\Exception $e) {
            \Log::error('Error fetching inventory items:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory items',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
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
            'low_stock_threshold' => 'nullable|numeric|min:0|max:100',
            'type' => 'required|string|max:50',
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
            $threshold = $mappedData['low_stock_threshold'] ?? null;

            // Use AI-powered status calculation with dynamic threshold
            $status = $this->calculateStatus($availableQty, $mappedData['total_quantity'], $threshold);

            $item = InventoryItem::create(array_merge($mappedData, [
                'available_quantity' => $availableQty,
                'status' => $status
            ]));

            // Invalidate inventory-related caches
            Cache::forget('dashboard:inventory_stats');
            Cache::forget('dashboard:category_stats');
            // Clear inventory list cache
            Cache::flush(); // Clear all cache when items are modified

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Create activity log for item creation
            ActivityLog::log('inventory_item_created', "New inventory item created: {$item->name} (Quantity: {$item->total_quantity})", [
                'category' => 'inventory',
                'inventory_item_id' => $item->id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'item_name' => $item->name,
                    'category' => $item->category,
                    'quantity' => $item->total_quantity,
                    'status' => $item->status
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item created successfully',
                'data' => $this->formatItemForFrontend($item)
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error creating inventory item:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'mapped_data' => $mappedData
            ]);

            // Check if error is related to missing column (migration not run)
            if (strpos($e->getMessage(), 'low_stock_threshold') !== false ||
                strpos($e->getMessage(), "doesn't exist") !== false ||
                strpos($e->getMessage(), 'Unknown column') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Database migration required. Please run: php artisan migrate',
                    'error' => 'The low_stock_threshold column does not exist. Please run the migration first.',
                    'hint' => 'Run: php artisan migrate'
                ], 500);
            }

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
            'low_stock_threshold' => 'nullable|numeric|min:0|max:100',
            'type' => 'sometimes|required|string|max:50',
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

            // ALWAYS recalculate status based on available quantity with dynamic threshold
            $currentAvailable = $mappedData['available_quantity'] ?? $item->available_quantity;
            $currentTotal = $mappedData['total_quantity'] ?? $item->total_quantity;

            // Use updated threshold if provided, otherwise use existing item threshold
            $threshold = $mappedData['low_stock_threshold'] ?? $item->low_stock_threshold;

            // Remove any status from request data - it should NOT be user-editable
            unset($mappedData['status']);

            // Calculate the correct status based on quantity and threshold
            $mappedData['status'] = $this->calculateStatus($currentAvailable, $currentTotal, $threshold);

            // Store old values for activity log
            $oldName = $item->name;
            $oldQuantity = $item->total_quantity;
            $oldStatus = $item->status;

            // Debug: Log what we're about to save
            \Log::info('About to update with data:', $mappedData);

            // Ensure threshold is properly formatted (convert to decimal if provided)
            if (isset($mappedData['low_stock_threshold'])) {
                $thresholdValue = $mappedData['low_stock_threshold'];
                // Convert to float and ensure it's between 0-100
                $thresholdValue = is_numeric($thresholdValue) ? (float)$thresholdValue : null;
                if ($thresholdValue !== null) {
                    $thresholdValue = max(0, min(100, $thresholdValue));
                    $mappedData['low_stock_threshold'] = $thresholdValue;
                } else {
                    unset($mappedData['low_stock_threshold']);
                }
            }

            $item->update($mappedData);

            // Invalidate inventory-related caches
            Cache::forget('dashboard:inventory_stats');
            Cache::forget('dashboard:category_stats');
            // Clear inventory list cache
            Cache::flush(); // Clear all cache when items are modified

            // Get fresh data from database
            $freshItem = $item->fresh();

            // Debug: Log what was saved
            \Log::info('After update - type in DB:', ['type' => $freshItem->type]);

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Create activity log for item update
            $changes = [];
            if ($oldName !== $freshItem->name) $changes[] = "name: {$oldName} → {$freshItem->name}";
            if ($oldQuantity !== $freshItem->total_quantity) $changes[] = "quantity: {$oldQuantity} → {$freshItem->total_quantity}";
            if ($oldStatus !== $freshItem->status) $changes[] = "status: {$oldStatus} → {$freshItem->status}";

            $changeDescription = !empty($changes) ? implode(', ', $changes) : 'Item details updated';

            ActivityLog::log('inventory_item_updated', "Inventory item updated: {$freshItem->name} - {$changeDescription}", [
                'category' => 'inventory',
                'inventory_item_id' => $freshItem->id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'item_name' => $freshItem->name,
                    'changes' => $changes,
                    'old_values' => [
                        'name' => $oldName,
                        'quantity' => $oldQuantity,
                        'status' => $oldStatus
                    ],
                    'new_values' => [
                        'name' => $freshItem->name,
                        'quantity' => $freshItem->total_quantity,
                        'status' => $freshItem->status
                    ]
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item updated successfully',
                'data' => $this->formatItemForFrontend($freshItem)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating inventory item:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'item_id' => $id,
                'mapped_data' => $mappedData
            ]);

            // Check if error is related to missing column (migration not run)
            if (strpos($e->getMessage(), 'low_stock_threshold') !== false ||
                strpos($e->getMessage(), "doesn't exist") !== false ||
                strpos($e->getMessage(), 'Unknown column') !== false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Database migration required. Please run: php artisan migrate',
                    'error' => 'The low_stock_threshold column does not exist. Please run the migration first.',
                    'hint' => 'Run: php artisan migrate'
                ], 500);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to update inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive inventory item (instead of permanent deletion)
     * Items are archived for 1 month before auto-deletion
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            // Check if already archived
            if ($item->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item is already archived'
                ], 400);
            }

            // Store item info before archiving for activity log
            $itemName = $item->name;
            $itemCategory = $item->category;

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Archive the item (sets archived_at and auto_delete_at)
            $item->archive($adminId);

            // Invalidate inventory-related caches
            Cache::forget('dashboard:inventory_stats');
            Cache::forget('dashboard:category_stats');
            // Clear inventory list cache
            Cache::flush(); // Clear all cache when items are modified

            // Create activity log for item archiving
            ActivityLog::log('inventory_item_archived', "Inventory item archived: {$itemName} (Category: {$itemCategory}) - Auto-delete in 1 month", [
                'category' => 'inventory',
                'inventory_item_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'item_name' => $itemName,
                    'category' => $itemCategory,
                    'archived_at' => $item->archived_at->toDateTimeString(),
                    'auto_delete_at' => $item->auto_delete_at->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item archived successfully. It will be automatically deleted after 1 month if not retrieved.',
                'data' => [
                    'archived_at' => $item->archived_at->toDateTimeString(),
                    'auto_delete_at' => $item->auto_delete_at->toDateTimeString(),
                    'days_until_auto_delete' => $item->getDaysUntilAutoDelete()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error archiving inventory item:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'item_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to archive inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get archived inventory items
     */
    public function getArchived(Request $request): JsonResponse
    {
        try {
            $query = InventoryItem::archived()
                ->with('archivedBy:id,full_name,username')
                ->select([
                    'id', 'name', 'category', 'description', 'total_quantity',
                    'available_quantity', 'type', 'status', 'location', 'size',
                    'color', 'unit', 'low_stock_threshold', 'image_path',
                    'created_at', 'updated_at', 'archived_at', 'auto_delete_at', 'archived_by'
                ])
                ->orderBy('archived_at', 'desc');

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = trim($request->search);
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            // Pagination
            $perPage = min($request->get('per_page', 20), 100);
            $items = $query->paginate($perPage);

            // Format items for frontend
            $formattedItems = $items->getCollection()->map(function($item) {
                $formatted = $this->formatItemForFrontend($item, false);
                $formatted['archived_at'] = $item->archived_at->toDateTimeString();
                $formatted['auto_delete_at'] = $item->auto_delete_at->toDateTimeString();
                $formatted['days_until_auto_delete'] = $item->getDaysUntilAutoDelete();
                $formatted['archived_by'] = $item->archivedBy ? [
                    'id' => $item->archivedBy->id,
                    'name' => $item->archivedBy->full_name ?? $item->archivedBy->username ?? 'Unknown'
                ] : null;
                return $formatted;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedItems,
                'pagination' => [
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total(),
                    'from' => $items->firstItem(),
                    'to' => $items->lastItem()
                ],
                'message' => 'Archived inventory items retrieved successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error retrieving archived items:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve archived items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore archived inventory item
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        try {
            $item = InventoryItem::withTrashed()->find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            if (!$item->isArchived()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item is not archived'
                ], 400);
            }

            // Store item info for activity log
            $itemName = $item->name;
            $itemCategory = $item->category;

            // Get authenticated admin/staff user
            $admin = $request->user();
            $adminName = 'System';
            $adminId = null;

            if ($admin && $admin instanceof Admin) {
                $adminName = $admin->full_name ?? $admin->username ?? 'Admin';
                $adminId = $admin->id;
            }

            // Restore from archive
            $item->restoreFromArchive();

            // Invalidate inventory-related caches
            Cache::forget('dashboard:inventory_stats');
            Cache::forget('dashboard:category_stats');
            Cache::flush();

            // Create activity log for item restoration
            ActivityLog::log('inventory_item_restored', "Inventory item restored from archive: {$itemName} (Category: {$itemCategory})", [
                'category' => 'inventory',
                'inventory_item_id' => $id,
                'admin_user_id' => $adminId,
                'actor_type' => 'admin',
                'actor_id' => $adminId,
                'actor_name' => $adminName,
                'metadata' => [
                    'item_name' => $itemName,
                    'category' => $itemCategory,
                    'restored_at' => now()->toDateTimeString()
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item restored successfully',
                'data' => $this->formatItemForFrontend($item)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error restoring inventory item:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'item_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate automated status based on quantity percentage with dynamic threshold
     * AI Feature: Helps admin identify items needing restock
     *
     * @param int $availableQuantity Current available quantity
     * @param int $totalQuantity Total quantity capacity
     * @param float|null $thresholdPercentage Low stock threshold percentage (0-100). Defaults to 30% if null
     * @return string Database enum value ('available', 'low stock', 'out of stock')
     */
    private function calculateStatus(int $availableQuantity, int $totalQuantity, ?float $thresholdPercentage = null): string
    {
        if ($availableQuantity == 0) {
            return 'out of stock';
        }

        // Use provided threshold or default to 30%
        $threshold = $thresholdPercentage ?? 30.0;

        // Ensure threshold is between 0 and 100
        $threshold = max(0, min(100, (float)$threshold));

        // Calculate percentage
        $percentage = ($availableQuantity / $totalQuantity) * 100;

        if ($percentage <= $threshold) {
            // Low Stock (at or below threshold) - Alert admin to restock
            return 'low stock';
        }

        // Available (above threshold)
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
        // Handle custom types: allow any string value, not just usable/consumable
        if (isset($data['type']) && !isset($data['quality'])) {
            $mapped['type'] = $data['type'];
        }
        if (isset($data['quality'])) {
            $qualityValue = $data['quality'];
            // Convert standard types to lowercase, but preserve custom types as-is (lowercase for consistency)
            if (strtolower($qualityValue) === 'usable' || strtolower($qualityValue) === 'consumable') {
                $mapped['type'] = strtolower($qualityValue);
            } else {
                // Custom type - convert to lowercase for consistency but preserve the custom value
                $mapped['type'] = strtolower(trim($qualityValue));
            }
        }

        // Direct field copies
        $directFields = ['category', 'location', 'size', 'color', 'unit', 'low_stock_threshold'];
        foreach ($directFields as $field) {
            if (isset($data[$field])) $mapped[$field] = $data[$field];
        }

        // Handle threshold from frontend (may come as threshold or lowStockThreshold)
        if (isset($data['threshold'])) $mapped['low_stock_threshold'] = $data['threshold'];
        if (isset($data['lowStockThreshold'])) $mapped['low_stock_threshold'] = $data['lowStockThreshold'];

        return $mapped;
    }

    /**
     * Format item for frontend consumption
     * Optimized: Defer Storage URL generation to reduce file system operations
     *
     * @param mixed $item The inventory item model
     * @param bool $generateImageUrl Whether to generate image URL (default: true for single items)
     */
    private function formatItemForFrontend($item, bool $generateImageUrl = true): array
    {
        $formatted = [
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
            'dateAdded' => $item->created_at ? $item->created_at->format('Y-m-d') : null,
            'isAvailable' => $item->available_quantity > 0,
            'low_stock_threshold' => $item->low_stock_threshold,
            'threshold' => $item->low_stock_threshold,
            'lowStockThreshold' => $item->low_stock_threshold,
            'created_at' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : null,
            'updated_at' => $item->updated_at ? $item->updated_at->format('Y-m-d H:i:s') : null,
            'image_path' => $item->image_path,
        ];

        // Only generate Storage URL if requested (defer for list views)
        if ($generateImageUrl && $item->image_path) {
            $formatted['image_url'] = url(Storage::url($item->image_path));
        } else {
            $formatted['image_url'] = null;
        }

        return $formatted;
    }

    /**
     * Upload image for inventory item
     */
    public function uploadImage(Request $request, int $id): JsonResponse
    {
        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120' // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old image if exists
            if ($item->image_path && Storage::disk('public')->exists($item->image_path)) {
                Storage::disk('public')->delete($item->image_path);
            }

            // Store new image
            $image = $request->file('image');
            $imageName = 'inventory_' . $id . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('inventory_images', $imageName, 'public');

            // Update item with image path
            $item->update(['image_path' => $imagePath]);

            // Get full URL for the image
            $imageUrl = url(Storage::url($imagePath));

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => [
                    'image_path' => $imagePath,
                    'image_url' => $imageUrl
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete image for inventory item
     */
    public function deleteImage(int $id): JsonResponse
    {
        try {
            $item = InventoryItem::find($id);

            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            if ($item->image_path && Storage::disk('public')->exists($item->image_path)) {
                Storage::disk('public')->delete($item->image_path);
            }

            $item->update(['image_path' => null]);

            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
