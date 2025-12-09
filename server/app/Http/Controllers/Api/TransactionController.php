<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\InventoryItem;
use App\Models\BorrowTransaction;
use App\Models\ReturnTransaction;
use App\Models\BorrowRecord;
use App\Models\ActivityLog;
use App\Helpers\UserHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TransactionController extends Controller
{
    /**
     * Create a new borrow transaction - supports students, employees, and users
     */
    public function createBorrow(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_qr_code' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'borrow_date' => 'required|date',
            'expected_return_date' => 'required|date|after:borrow_date',
            'purpose' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('🔍 createBorrow called', ['qr_code' => $request->user_qr_code]);

            // Use UserHelper to find user across all tables (students → employees → users)
            $result = UserHelper::findUserByQrCode($request->user_qr_code);

            if (!$result) {
                Log::error('❌ User not found in createBorrow', ['qr_code' => $request->user_qr_code]);
                return response()->json([
                    'success' => false,
                    'message' => 'User not found with QR code. Please ensure the user is registered in the system.'
                ], 404);
            }

            $user = $result['user'];
            $userType = $result['type'];
            $idNumber = $result['id_number'];

            Log::info('✅ User found successfully', [
                'user_id' => $user->id,
                'user_type' => $userType,
                'id_number' => $idNumber
            ]);

            // Check if user is active
            if (!UserHelper::isUserActive($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account is not active. Please contact the administrator.'
                ], 403);
            }

            $transactions = [];

            DB::beginTransaction();

            foreach ($request->items as $itemData) {
                $inventoryItem = InventoryItem::find($itemData['inventory_item_id']);

                // Check availability
                if (!$inventoryItem->isAvailable($itemData['quantity'])) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient quantity for {$inventoryItem->name}. Available: {$inventoryItem->available_quantity}"
                    ], 400);
                }

                // Prepare borrower data based on table type
                $borrowerData = [
                    'borrower_type' => $userType,
                    'borrower_id' => $user->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'quantity' => $itemData['quantity'],
                    'borrow_date' => $request->borrow_date,
                    'expected_return_date' => $request->expected_return_date,
                    'purpose' => $request->purpose,
                    'location' => $request->location,
                    'notes' => $request->notes,
                    'status' => 'pending', // Set to pending - admin must approve
                    'approved_by' => null, // Will be set when admin approves
                    'approved_at' => null  // Will be set when admin approves
                ];

                // Add borrower details based on type
                if ($userType === 'student') {
                    $borrowerData['borrower_name'] = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                    $borrowerData['borrower_id_number'] = $user->student_id ?? $idNumber;
                    $borrowerData['borrower_email'] = $user->email ?? '';
                    $borrowerData['borrower_contact'] = $user->contact_number ?? '';
                    $borrowerData['user_id'] = null; // Not in users table
                } elseif ($userType === 'employee') {
                    $borrowerData['borrower_name'] = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                    $borrowerData['borrower_id_number'] = $user->emp_id ?? $user->employee_id ?? $idNumber;
                    $borrowerData['borrower_email'] = $user->email ?? '';
                    $borrowerData['borrower_contact'] = $user->contact_number ?? '';
                    $borrowerData['user_id'] = null; // Not in users table
                } else {
                    // From users table
                    $borrowerData['borrower_name'] = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                    $borrowerData['borrower_id_number'] = $user->id_number ?? $idNumber;
                    $borrowerData['borrower_email'] = $user->email ?? '';
                    $borrowerData['borrower_contact'] = $user->contact_number ?? '';
                    $borrowerData['user_id'] = $user->id;
                }

                Log::info('💾 Creating borrow transaction', [
                    'borrower_type' => $userType,
                    'borrower_id' => $user->id,
                    'item_id' => $inventoryItem->id,
                    'quantity' => $itemData['quantity']
                ]);

                // Create borrow transaction with pending status
                // Inventory will NOT be decremented until admin approves
                $transaction = BorrowTransaction::create($borrowerData);

                // DO NOT update inventory here - wait for admin approval
                // Inventory will be decremented when admin approves the request

                $transactions[] = $transaction->load(['inventoryItem']);

                // Log activity: Borrow request created
                ActivityLog::log('borrow_request', "Borrow request submitted by {$borrowerData['borrower_name']} for {$inventoryItem->name}", [
                    'category' => 'transaction',
                    'borrow_transaction_id' => $transaction->id,
                    'inventory_item_id' => $inventoryItem->id,
                    'actor_type' => $userType,
                    'actor_id' => $user->id,
                    'actor_name' => $borrowerData['borrower_name'],
                    'metadata' => [
                        'quantity' => $itemData['quantity'],
                        'purpose' => $request->purpose,
                        'expected_return_date' => $request->expected_return_date,
                    ],
                ]);
            }

            DB::commit();

            Log::info('✅ Borrow request created successfully', ['transaction_count' => count($transactions)]);

            // Format user data for response
            $userData = UserHelper::formatUserData($user, $userType);

            return response()->json([
                'success' => true,
                'message' => 'Borrow request submitted successfully. Awaiting admin approval.',
                'data' => [
                    'transactions' => $transactions,
                    'user' => $userData
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Error in createBorrow', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to process borrow request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get borrowed items for a user - searches students, employees, and users tables
     */
    public function getBorrowedItems(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_qr_code' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \Log::info('🔍 getBorrowedItems called', ['qr_code' => $request->user_qr_code]);

            // Use UserHelper to find user across all tables (students → employees → users)
            $result = \App\Helpers\UserHelper::findUserByQrCode($request->user_qr_code);

            if (!$result) {
                \Log::warning('❌ User not found in getBorrowedItems', ['qr_code' => $request->user_qr_code]);
                return response()->json([
                    'success' => false,
                    'message' => 'User not found. Please ensure you are registered in the system.'
                ], 404);
            }

            $user = $result['user'];
            $userType = $result['type'];

            \Log::info('✅ User found in getBorrowedItems', [
                'user_id' => $user->id,
                'user_type' => $userType
            ]);

            // Check if user is active
            if (!\App\Helpers\UserHelper::isUserActive($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account is not active. Please contact the administrator.'
                ], 403);
            }

            // Get borrowed items using borrower_type and borrower_id (supports all user types)
            $borrowedItems = BorrowTransaction::where('borrower_type', $userType)
                ->where('borrower_id', $user->id)
                ->where('status', 'borrowed')
                ->with(['inventoryItem'])
                ->get()
                ->map(function ($transaction) {
                    return [
                        'borrowId' => $transaction->transaction_id,
                        'id' => $transaction->id,
                        'itemName' => $transaction->inventoryItem->name ?? 'Unknown Item',
                        'category' => $transaction->inventoryItem->category ?? 'N/A',
                        'quantity' => $transaction->quantity,
                        'borrowDate' => $transaction->borrow_date->format('Y-m-d'),
                        'expectedReturnDate' => $transaction->expected_return_date->format('Y-m-d'),
                        'purpose' => $transaction->purpose,
                        'location' => $transaction->location,
                        'status' => $transaction->status,
                        'isOverdue' => $transaction->isOverdue(),
                        'daysOverdue' => $transaction->days_overdue
                    ];
                });

            \Log::info('📦 Found borrowed items', ['count' => $borrowedItems->count()]);

            // Format user data
            $userData = \App\Helpers\UserHelper::formatUserData($user, $userType);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $userData,
                    'borrowedItems' => $borrowedItems
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve borrowed items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all borrow requests for admin dashboard
     * Each item borrowed appears as a separate row
     */
    public function getAllBorrowRequests(Request $request): JsonResponse
    {
        try {
            $query = BorrowTransaction::with(['inventoryItem']);

            // Status filter with smart defaults
            if ($request->has('status')) {
                // If explicitly requesting specific status
                if ($request->status !== 'all') {
                    // When requesting 'borrowed', also include 'pending_return_verification'
                    // This ensures items remain visible in Borrowed Items until admin verifies
                    if ($request->status === 'borrowed') {
                        $query->whereIn('status', ['borrowed', 'pending_return_verification']);
                    } else {
                        $query->where('status', $request->status);
                    }
                }
                // If 'all', don't filter - show everything
            } else {
                // DEFAULT: If no status parameter, show ONLY pending (for Borrowers Request Dashboard)
                $query->where('status', 'pending');
            }

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('transaction_id', 'LIKE', "%{$search}%")
                      ->orWhere('borrower_name', 'LIKE', "%{$search}%")
                      ->orWhere('borrower_email', 'LIKE', "%{$search}%")
                      ->orWhere('borrower_id_number', 'LIKE', "%{$search}%")
                      ->orWhere('purpose', 'LIKE', "%{$search}%")
                      ->orWhereHas('inventoryItem', function($itemQuery) use ($search) {
                          $itemQuery->where('name', 'LIKE', "%{$search}%");
                      });
                });
            }

            $perPage = $request->get('per_page', 20);
            $borrowRequests = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Format each request
            $formattedRequests = $borrowRequests->getCollection()->map(function($transaction) {
                $item = $transaction->inventoryItem;

                return [
                    'id' => $transaction->id,
                    'formatted_id' => $transaction->formatted_id,
                    'display_id' => $transaction->display_id,
                    'request_id' => $transaction->transaction_id,
                    'borrower_name' => $transaction->borrower_name,
                    'borrower_type' => ucfirst($transaction->borrower_type),
                    'borrower_id_number' => $transaction->borrower_id_number,
                    'borrower_email' => $transaction->borrower_email,
                    'borrower_contact' => $transaction->borrower_contact,
                    'item_id' => $item ? $item->id : $transaction->inventory_item_id,
                    'item_formatted_id' => $item ? $item->formatted_id : 'INV-' . str_pad($transaction->inventory_item_id, 3, '0', STR_PAD_LEFT),
                    'item_name' => $item ? $item->name : 'Unknown Item',
                    'item_category' => $item ? $item->category : 'N/A',
                    'item_type' => $item ? $item->type : 'N/A',
                    'quantity' => $transaction->quantity,
                    'purpose' => $transaction->purpose,
                    'location' => $transaction->location,
                    'borrow_date' => $transaction->borrow_date->format('Y-m-d'),
                    'expected_return_date' => $transaction->expected_return_date->format('Y-m-d'),
                    'actual_return_date' => $transaction->actual_return_date ? $transaction->actual_return_date->format('Y-m-d') : null,
                    'status' => $transaction->status,
                    'notes' => $transaction->notes,
                    'approved_by' => $transaction->approved_by,
                    'approved_at' => $transaction->approved_at ? $transaction->approved_at->format('Y-m-d H:i:s') : null,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $transaction->updated_at->format('Y-m-d H:i:s')
                ];
            });

            $borrowRequests->setCollection($formattedRequests);

            return response()->json([
                'success' => true,
                'data' => $borrowRequests,
                'message' => 'Borrow requests retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve borrow requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process return transactions
     */
    public function createReturn(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'returns' => 'required|array|min:1',
            'returns.*.borrow_transaction_id' => 'required|exists:borrow_transactions,id',
            'returns.*.condition' => 'required|in:excellent,good,fair,damaged,lost',
            'returns.*.return_notes' => 'nullable|string',
            'returns.*.damage_fee' => 'nullable|numeric|min:0',
            'return_date' => 'required|date',
            'received_by' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $returnTransactions = [];

            DB::beginTransaction();

            // Eager load all borrow transactions in one query to avoid N+1
            $transactionIds = collect($request->returns)->pluck('borrow_transaction_id')->unique()->toArray();
            $borrowTransactions = BorrowTransaction::with('inventoryItem')
                ->whereIn('id', $transactionIds)
                ->get()
                ->keyBy('id');

            foreach ($request->returns as $returnData) {
                // Get from pre-loaded collection instead of querying database
                $borrowTransaction = $borrowTransactions->get($returnData['borrow_transaction_id']);

                if (!$borrowTransaction) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Borrow transaction with ID {$returnData['borrow_transaction_id']} not found"
                    ], 404);
                }

                if ($borrowTransaction->status !== 'borrowed') {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Item {$borrowTransaction->inventoryItem->name} is not currently borrowed"
                    ], 400);
                }

                // Mark as returned
                $borrowTransaction->markAsReturned($request->received_by, [
                    'return_date' => $request->return_date,
                    'condition' => $returnData['condition'],
                    'notes' => $returnData['return_notes'] ?? null,
                    'damage_fee' => $returnData['damage_fee'] ?? 0
                ]);

                $returnTransactions[] = $borrowTransaction->load(['returnTransaction', 'inventoryItem', 'user']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Return processed successfully',
                'data' => [
                    'returnTransactions' => $returnTransactions
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single transaction by ID
     */
    public function show(int $id): JsonResponse
    {
        try {
            $transaction = BorrowTransaction::with(['user', 'inventoryItem'])
                ->find($id);

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transaction history
     */
    public function getTransactionHistory(Request $request, int $userId = null): JsonResponse
    {
        try {
            $query = BorrowTransaction::with(['inventoryItem', 'user', 'returnTransaction']);

            if ($userId) {
                $query->where('user_id', $userId);
            }

            // Add filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('start_date')) {
                $query->where('borrow_date', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->where('borrow_date', '<=', $request->end_date);
            }

            $transactions = $query->orderBy('created_at', 'desc')
                                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transaction history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue items
     */
    public function getOverdueItems(): JsonResponse
    {
        try {
            $overdueItems = BorrowTransaction::overdue()
                ->with(['user', 'inventoryItem'])
                ->get()
                ->map(function ($transaction) {
                    return [
                        'transaction_id' => $transaction->transaction_id,
                        'user' => [
                            'name' => $transaction->user->full_name,
                            'type' => $transaction->user->type,
                            'contact' => $transaction->user->contact_number,
                            'email' => $transaction->user->email
                        ],
                        'item' => [
                            'name' => $transaction->inventoryItem->name,
                            'category' => $transaction->inventoryItem->category
                        ],
                        'quantity' => $transaction->quantity,
                        'borrow_date' => $transaction->borrow_date->format('Y-m-d'),
                        'expected_return_date' => $transaction->expected_return_date->format('Y-m-d'),
                        'days_overdue' => $transaction->days_overdue,
                        'purpose' => $transaction->purpose
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $overdueItems
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve overdue items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent transactions
     */
    public function getRecentTransactions(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);

            $recentTransactions = BorrowTransaction::recent($limit)
                ->with(['user', 'inventoryItem'])
                ->get()
                ->map(function ($transaction) {
                    return [
                        'transaction_id' => $transaction->transaction_id,
                        'user_name' => $transaction->user->full_name,
                        'item_name' => $transaction->inventoryItem->name,
                        'quantity' => $transaction->quantity,
                        'status' => $transaction->status,
                        'borrow_date' => $transaction->borrow_date->format('Y-m-d'),
                        'expected_return_date' => $transaction->expected_return_date->format('Y-m-d'),
                        'created_at' => $transaction->created_at->format('Y-m-d H:i:s')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $recentTransactions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recent transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a pending borrow request
     */
    public function approveBorrowRequest($transactionId): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = BorrowTransaction::with(['inventoryItem'])->findOrFail($transactionId);

            // Check if already approved or rejected
            if ($transaction->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been ' . $transaction->status
                ], 400);
            }

            // Get the inventory item (already eager loaded)
            $inventoryItem = $transaction->inventoryItem;

            if (!$inventoryItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            // Check if enough quantity available
            if ($inventoryItem->available_quantity < $transaction->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient inventory quantity. Available: {$inventoryItem->available_quantity}, Requested: {$transaction->quantity}"
                ], 400);
            }

            // Get admin user info
            $adminUser = auth()->user();
            $adminUserId = $adminUser ? (is_numeric($adminUser->id) ? $adminUser->id : null) : null;
            $adminUserName = $adminUser ? ($adminUser->name ?? 'Admin') : 'Admin';

            // Update transaction status
            $transaction->status = 'borrowed';
            $transaction->approved_by = $adminUserId ?? 'Admin';
            $transaction->approved_at = now();
            $transaction->save();

            // Decrement inventory quantity NOW that it's approved
            $inventoryItem->borrowQuantity($transaction->quantity);

            // Add to borrow_records (active borrows table)
            BorrowRecord::create([
                'transaction_id' => $transaction->transaction_id,
                'borrow_transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'borrower_type' => $transaction->borrower_type,
                'borrower_id' => $transaction->borrower_id,
                'borrower_name' => $transaction->borrower_name,
                'borrower_id_number' => $transaction->borrower_id_number,
                'borrower_email' => $transaction->borrower_email,
                'borrower_contact' => $transaction->borrower_contact,
                'inventory_item_id' => $transaction->inventory_item_id,
                'quantity' => $transaction->quantity,
                'borrow_date' => $transaction->borrow_date,
                'expected_return_date' => $transaction->expected_return_date,
                'purpose' => $transaction->purpose,
                'location' => $transaction->location,
                'notes' => $transaction->notes,
                'status' => 'borrowed',
                'approved_by' => $transaction->approved_by,
                'approved_at' => $transaction->approved_at,
            ]);

            // Log activity: Borrow approved
            ActivityLog::log('borrow_approved', "Borrow request approved for {$transaction->borrower_name} - Item: {$inventoryItem->name}", [
                'category' => 'transaction',
                'borrow_transaction_id' => $transaction->id,
                'inventory_item_id' => $transaction->inventory_item_id,
                'admin_user_id' => $adminUserId,
                'actor_type' => 'admin',
                'actor_id' => $adminUserId,
                'actor_name' => $adminUserName,
                'metadata' => [
                    'quantity' => $transaction->quantity,
                    'expected_return_date' => $transaction->expected_return_date->format('Y-m-d'),
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Borrow request approved successfully',
                'data' => $transaction->load(['user', 'inventoryItem'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve borrow request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a pending borrow request
     */
    public function rejectBorrowRequest(Request $request, $transactionId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $transaction = BorrowTransaction::findOrFail($transactionId);

            // Check if already approved or rejected
            if ($transaction->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been ' . $transaction->status
                ], 400);
            }

            // Get admin user info
            $adminUser = auth()->user();
            $adminUserId = $adminUser ? (is_numeric($adminUser->id) ? $adminUser->id : null) : null;
            $adminUserName = $adminUser ? ($adminUser->name ?? 'Admin') : 'Admin';

            // Update transaction status
            $transaction->status = 'rejected';
            $transaction->notes = ($transaction->notes ? $transaction->notes . "\n\n" : '') .
                                  'Rejection reason: ' . ($request->reason ?? 'Not specified');
            $transaction->save();

            // Do NOT decrement inventory - request was rejected

            // Log activity: Borrow rejected
            ActivityLog::log('borrow_rejected', "Borrow request rejected for {$transaction->borrower_name}", [
                'category' => 'transaction',
                'borrow_transaction_id' => $transaction->id,
                'inventory_item_id' => $transaction->inventory_item_id,
                'admin_user_id' => $adminUserId,
                'actor_type' => 'admin',
                'actor_id' => $adminUserId,
                'actor_name' => $adminUserName,
                'metadata' => [
                    'rejection_reason' => $request->reason ?? 'Not specified',
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Borrow request rejected',
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject borrow request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extend return date for a borrowed item
     */
    public function extendReturnDate(Request $request, $transactionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'new_return_date' => 'required|date|after:today',
            'reason' => 'nullable|string',
            'extended_by' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $transaction = BorrowTransaction::with(['inventoryItem'])->find($transactionId);

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            if ($transaction->status !== 'borrowed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Item is not currently borrowed'
                ], 400);
            }

            // Update the return date
            $transaction->expected_return_date = $request->new_return_date;

            // Add extension note
            $extensionNote = "Return date extended to {$request->new_return_date} by {$request->extended_by}";
            if ($request->reason) {
                $extensionNote .= ". Reason: {$request->reason}";
            }

            $currentNotes = $transaction->notes ? $transaction->notes . "\n" : "";
            $transaction->notes = $currentNotes . "[" . now()->format('Y-m-d H:i:s') . "] " . $extensionNote;

            $transaction->save();

            return response()->json([
                'success' => true,
                'message' => 'Return date extended successfully',
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to extend return date',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all returned items (for Returnee Item dashboard)
     */
    public function getReturnedItems(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');

            Log::info('🔍 getReturnedItems called', ['search' => $search]);

            // Get all returned transactions with their ReturnTransaction records
            // This fetches items that have been verified and moved to Returnee Item for inspection
            $query = BorrowTransaction::with([
                'inventoryItem',
                'returnTransaction'  // ReturnTransaction contains inspection details
            ])->where('status', 'returned')
              ->whereHas('returnTransaction'); // Only show items that have ReturnTransaction (verified returns)

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    // Search in borrower fields (stored directly in BorrowTransaction)
                    $q->where('borrower_name', 'like', '%' . $search . '%')
                      ->orWhere('borrower_id_number', 'like', '%' . $search . '%')
                      ->orWhere('borrower_email', 'like', '%' . $search . '%')
                      ->orWhere('transaction_id', 'like', '%' . $search . '%')
                      // Search in inventory items
                      ->orWhereHas('inventoryItem', function($itemQuery) use ($search) {
                          $itemQuery->where('name', 'like', '%' . $search . '%');
                      });
                });
            }

            $query->orderBy('created_at', 'desc');

            // Support backward compatibility: allow getting all records if requested
            if ($request->has('no_pagination') && $request->get('no_pagination') == 'true') {
                $returnedItems = $query->get();

                Log::info('📦 Found returned items (no pagination)', [
                    'count' => $returnedItems->count()
                ]);

                // Format the data for frontend
                $formattedItems = $returnedItems->map(function($transaction) {
                $item = $transaction->inventoryItem;
                $returnInfo = $transaction->returnTransaction;

                // Skip if essential data missing
                if (!$item || !$returnInfo) {
                    Log::warning('⚠️ Skipping transaction with missing relationships', [
                        'id' => $transaction->id,
                        'has_item' => !!$item,
                        'has_return' => !!$returnInfo
                    ]);
                    return null;
                }

                return [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->transaction_id,
                    'return_transaction_id' => $returnInfo->id, // Include ReturnTransaction ID for status updates
                    'item_name' => $item->name,
                    'item_category' => $item->category,
                    'item_details' => $item->description,
                    'quantity' => $transaction->quantity,
                    'returner_name' => $transaction->borrower_name ?? 'Unknown',
                    'returner_id' => $transaction->borrower_id_number ?? 'N/A',
                    'returner_type' => $transaction->borrower_type ?? 'N/A',
                    'returner_email' => $transaction->borrower_email ?? 'N/A',
                    'returner_contact' => $transaction->borrower_contact ?? 'N/A',
                    'borrow_date' => $transaction->borrow_date,
                    'expected_return_date' => $transaction->expected_return_date,
                    'actual_return_date' => $transaction->actual_return_date ?? $returnInfo->return_date ?? Carbon::now()->toDateString(),
                    'return_condition' => $returnInfo->condition ?? 'good', // Default to 'good' until inspection
                    'return_notes' => $returnInfo->return_notes ?? '',
                    'damage_fee' => $returnInfo->damage_fee ?? 0,
                    'received_by' => $returnInfo->received_by ?? 'N/A',
                    'inspection_status' => $returnInfo->inspection_status ?? 'pending_inspection',
                    'purpose' => $transaction->purpose,
                    'location' => $transaction->location,
                    'status' => 'Returned',
                    'days_borrowed' => $transaction->actual_return_date
                        ? Carbon::parse($transaction->borrow_date)->diffInDays($transaction->actual_return_date)
                        : ($returnInfo->return_date
                            ? Carbon::parse($transaction->borrow_date)->diffInDays($returnInfo->return_date)
                            : 0)
                ];
            })->filter()->values(); // Remove nulls and re-index

                Log::info('✅ Formatted returned items (no pagination)', [
                    'count' => $formattedItems->count()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $formattedItems,
                    'message' => 'Returned items loaded successfully'
                ]);
            }

            // Use pagination (default behavior)
            $perPage = $request->get('per_page', 15); // Default 15 items per page
            $returnedItems = $query->paginate($perPage);

            Log::info('📦 Found returned items (paginated)', [
                'total' => $returnedItems->total(),
                'per_page' => $returnedItems->perPage(),
                'current_page' => $returnedItems->currentPage()
            ]);

            // Format the data for frontend - Use borrower data stored directly in BorrowTransaction
            $formattedItems = $returnedItems->getCollection()->map(function($transaction) {
                $item = $transaction->inventoryItem;
                $returnInfo = $transaction->returnTransaction;

                // Skip if essential data missing
                if (!$item || !$returnInfo) {
                    Log::warning('⚠️ Skipping transaction with missing relationships', [
                        'id' => $transaction->id,
                        'has_item' => !!$item,
                        'has_return' => !!$returnInfo
                    ]);
                    return null;
                }

                return [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->transaction_id,
                    'return_transaction_id' => $returnInfo->id,
                    'item_name' => $item->name,
                    'item_category' => $item->category,
                    'item_details' => $item->description,
                    'quantity' => $transaction->quantity,
                    'returner_name' => $transaction->borrower_name ?? 'Unknown',
                    'returner_id' => $transaction->borrower_id_number ?? 'N/A',
                    'returner_type' => $transaction->borrower_type ?? 'N/A',
                    'returner_email' => $transaction->borrower_email ?? 'N/A',
                    'returner_contact' => $transaction->borrower_contact ?? 'N/A',
                    'borrow_date' => $transaction->borrow_date,
                    'expected_return_date' => $transaction->expected_return_date,
                    'actual_return_date' => $transaction->actual_return_date ?? $returnInfo->return_date ?? Carbon::now()->toDateString(),
                    'return_condition' => $returnInfo->condition ?? 'good',
                    'return_notes' => $returnInfo->return_notes ?? '',
                    'damage_fee' => $returnInfo->damage_fee ?? 0,
                    'received_by' => $returnInfo->received_by ?? 'N/A',
                    'inspection_status' => $returnInfo->inspection_status ?? 'pending_inspection',
                    'purpose' => $transaction->purpose,
                    'location' => $transaction->location,
                    'status' => 'Returned',
                    'days_borrowed' => $transaction->actual_return_date
                        ? Carbon::parse($transaction->borrow_date)->diffInDays($transaction->actual_return_date)
                        : ($returnInfo->return_date
                            ? Carbon::parse($transaction->borrow_date)->diffInDays($returnInfo->return_date)
                            : 0)
                ];
            })->filter()->values();

            // Replace the collection with formatted items while keeping pagination metadata
            $returnedItems->setCollection($formattedItems);

            return response()->json([
                'success' => true,
                'data' => $returnedItems,
                'message' => 'Returned items loaded successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error in getReturnedItems', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load returned items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark borrowed item as returned (simple version for admin dashboard)
     */
    public function markAsReturned(Request $request, $transactionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'condition' => 'required|in:excellent,good,fair,damaged,lost',
            'return_notes' => 'nullable|string',
            'damage_fee' => 'nullable|numeric|min:0',
            'received_by' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \Log::info('markAsReturned: Looking for transaction ID: ' . $transactionId);
            $transaction = BorrowTransaction::with(['inventoryItem'])->find($transactionId);

            if (!$transaction) {
                \Log::warning('markAsReturned: Transaction not found with ID: ' . $transactionId);
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found'
                ], 404);
            }

            \Log::info('markAsReturned: Found transaction', [
                'id' => $transaction->id,
                'transaction_id' => $transaction->transaction_id,
                'status' => $transaction->status
            ]);

            if ($transaction->status !== 'borrowed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Item is not currently borrowed'
                ], 400);
            }

            // Mark as returned using the model method
            $success = $transaction->markAsReturned($request->received_by, [
                'return_date' => now()->toDateString(),
                'condition' => $request->condition,
                'notes' => $request->return_notes,
                'damage_fee' => $request->damage_fee ?? 0
            ]);

            if ($success) {
                // Reload transaction with relationships
                $transaction->load(['returnTransaction', 'inventoryItem', 'user']);
                return response()->json([
                    'success' => true,
                    'message' => 'Item marked as returned successfully',
                    'data' => $transaction
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to mark item as returned'
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all returned items pending inspection (for Returned Items table)
     */
    public function getPendingInspections(Request $request): JsonResponse
    {
        try {
            Log::info('🔍 getPendingInspections called');

            $inspectionStatus = $request->get('inspection_status');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $query = ReturnTransaction::with([
                'borrowTransaction.inventoryItem',
                'returnVerification',
                'inspectedByUser'
            ]);

            // Filter by inspection status
            if ($inspectionStatus) {
                $query->where('inspection_status', $inspectionStatus);
            } else {
                // Default to pending inspection
                $query->pendingInspection();
            }

            // Filter by date range
            if ($startDate) {
                $query->whereDate('return_date', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('return_date', '<=', $endDate);
            }

            // Eager load all necessary relationships to avoid N+1 queries
            $query->with([
                'borrowTransaction.inventoryItem', // Nested eager loading
                'returnVerification.verifiedByUser' // Nested eager loading for verification details
            ]);

            $query->orderBy('return_date', 'desc');

            // Support backward compatibility: allow getting all records if requested
            if ($request->has('no_pagination') && $request->get('no_pagination') == 'true') {
                $returns = $query->get();

                // Enrich with borrower information
                // Relationships are already loaded, no additional queries in map
                $enrichedReturns = $returns->map(function ($return) {
                $borrowTx = $return->borrowTransaction;

                // Get borrower details based on type
                $borrowerDetails = $this->getBorrowerDetails(
                    $borrowTx->borrower_type,
                    $borrowTx->borrower_id
                );

                return [
                    'id' => $return->id,
                    'return_date' => $return->return_date,
                    'inspection_status' => $return->inspection_status,
                    'inspection_notes' => $return->inspection_notes,
                    'inspected_by' => $return->inspectedByUser ? $return->inspectedByUser->name : null,
                    'inspected_at' => $return->inspected_at,
                    'condition' => $return->condition,
                    'damage_fee' => $return->damage_fee,
                    'return_notes' => $return->return_notes,
                    'verification' => $return->returnVerification ? [
                        'verification_id' => $return->returnVerification->verification_id,
                        'verified_by' => $return->returnVerification->verifiedByUser->name ?? null,
                        'verified_at' => $return->returnVerification->verified_at
                    ] : null,
                    'borrower' => [
                        'type' => $borrowTx->borrower_type,
                        'id' => $borrowTx->borrower_id,
                        'name' => $borrowerDetails['name'],
                        'id_number' => $borrowerDetails['id_number'],
                        'email' => $borrowerDetails['email'],
                        'contact' => $borrowerDetails['contact']
                    ],
                    'item' => [
                        'id' => $borrowTx->inventoryItem->id,
                        'name' => $borrowTx->inventoryItem->name,
                        'category' => $borrowTx->inventoryItem->category,
                        'item_code' => $borrowTx->inventoryItem->item_code
                    ],
                    'quantity' => $borrowTx->quantity,
                    'borrow_date' => $borrowTx->borrow_date,
                    'expected_return_date' => $borrowTx->expected_return_date,
                    'created_at' => $return->created_at,
                    'updated_at' => $return->updated_at
                ];
                });

                Log::info('📦 Found returns for inspection (no pagination)', ['count' => $enrichedReturns->count()]);

                return response()->json([
                    'success' => true,
                    'message' => 'Returned items retrieved successfully',
                    'data' => $enrichedReturns
                ]);
            }

            // Use pagination (default behavior)
            $perPage = $request->get('per_page', 15); // Default 15 items per page
            $returns = $query->paginate($perPage);

            // Enrich with borrower information
            // Relationships are already loaded, no additional queries in map
            $enrichedReturns = $returns->getCollection()->map(function ($return) {
                $borrowTx = $return->borrowTransaction;

                // Get borrower details based on type
                $borrowerDetails = $this->getBorrowerDetails(
                    $borrowTx->borrower_type,
                    $borrowTx->borrower_id
                );

                return [
                    'id' => $return->id,
                    'return_date' => $return->return_date,
                    'inspection_status' => $return->inspection_status,
                    'inspection_notes' => $return->inspection_notes,
                    'inspected_by' => $return->inspectedByUser ? $return->inspectedByUser->name : null,
                    'inspected_at' => $return->inspected_at,
                    'condition' => $return->condition,
                    'damage_fee' => $return->damage_fee,
                    'return_notes' => $return->return_notes,
                    'verification' => $return->returnVerification ? [
                        'verification_id' => $return->returnVerification->verification_id,
                        'verified_by' => $return->returnVerification->verifiedByUser->name ?? null,
                        'verified_at' => $return->returnVerification->verified_at
                    ] : null,
                    'borrower' => [
                        'type' => $borrowTx->borrower_type,
                        'id' => $borrowTx->borrower_id,
                        'name' => $borrowerDetails['name'],
                        'id_number' => $borrowerDetails['id_number'],
                        'email' => $borrowerDetails['email'],
                        'contact' => $borrowerDetails['contact']
                    ],
                    'item' => [
                        'id' => $borrowTx->inventoryItem->id,
                        'name' => $borrowTx->inventoryItem->name,
                        'category' => $borrowTx->inventoryItem->category,
                        'item_code' => $borrowTx->inventoryItem->item_code
                    ],
                    'quantity' => $borrowTx->quantity,
                    'borrow_date' => $borrowTx->borrow_date,
                    'expected_return_date' => $borrowTx->expected_return_date,
                    'created_at' => $return->created_at,
                    'updated_at' => $return->updated_at
                ];
            });

            // Replace the collection with enriched returns while keeping pagination metadata
            $returns->setCollection($enrichedReturns);

            Log::info('📦 Found returns for inspection (paginated)', [
                'total' => $returns->total(),
                'per_page' => $returns->perPage(),
                'current_page' => $returns->currentPage()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Returned items retrieved successfully',
                'data' => $returns
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error getting pending inspections', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending inspections: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Inspect returned item and mark condition (final step in return workflow)
     */
    public function inspectReturnedItem(Request $request, $returnTransactionId): JsonResponse
    {
        try {
            Log::info('🔍 inspectReturnedItem called', [
                'return_transaction_id' => $returnTransactionId,
                'data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'admin_user_id' => 'required|integer|exists:admin,id',
                'inspection_status' => 'required|in:good_condition,minor_damage,major_damage,lost,unusable',
                'inspection_notes' => 'nullable|string',
                'damage_fee' => 'nullable|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $returnTransaction = ReturnTransaction::with([
                'borrowTransaction.inventoryItem',
                'returnVerification'
            ])->find($returnTransactionId);

            if (!$returnTransaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Return transaction not found'
                ], 404);
            }

            if (!$returnTransaction->isPendingInspection()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item already inspected',
                    'current_status' => $returnTransaction->inspection_status
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Mark as inspected
                $returnTransaction->markAsInspected(
                    $request->inspection_status,
                    $request->admin_user_id,
                    $request->inspection_notes,
                    $request->damage_fee ?? 0
                );

                // If item is damaged or lost, update inventory status
                $inventoryItem = $returnTransaction->borrowTransaction->inventoryItem;

                if (in_array($request->inspection_status, ['major_damage', 'lost', 'unusable'])) {
                    // Could reduce available quantity or mark item as damaged
                    Log::info('⚠️ Item marked as damaged/lost', [
                        'item_id' => $inventoryItem->id,
                        'item_name' => $inventoryItem->name,
                        'status' => $request->inspection_status
                    ]);

                    // Optional: Reduce quantity if lost/unusable
                    if (in_array($request->inspection_status, ['lost', 'unusable'])) {
                        $inventoryItem->quantity -= $returnTransaction->borrowTransaction->quantity;
                        $inventoryItem->save();

                        Log::info('📉 Inventory quantity reduced due to loss/damage', [
                            'item_id' => $inventoryItem->id,
                            'new_quantity' => $inventoryItem->quantity
                        ]);
                    }
                }

                DB::commit();

                Log::info('✅ Item inspection completed', [
                    'return_transaction_id' => $returnTransactionId,
                    'inspection_status' => $request->inspection_status,
                    'damage_fee' => $request->damage_fee ?? 0
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Item inspection completed successfully',
                    'data' => $returnTransaction->load([
                        'borrowTransaction.inventoryItem',
                        'returnVerification',
                        'inspectedByUser'
                    ])
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('❌ Error inspecting returned item', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error inspecting item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Get borrower details based on type and ID
     */
    private function getBorrowerDetails($borrowerType, $borrowerId)
    {
        try {
            if ($borrowerType === 'student') {
                $student = \App\Models\Student::find($borrowerId);
                if ($student) {
                    return [
                        'name' => trim("{$student->first_name} {$student->middle_name} {$student->last_name}"),
                        'id_number' => $student->student_id,
                        'email' => $student->email,
                        'contact' => $student->contact_number
                    ];
                }
            } elseif ($borrowerType === 'employee') {
                $employee = \App\Models\Employee::find($borrowerId);
                if ($employee) {
                    return [
                        'name' => trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}"),
                        'id_number' => $employee->employee_id,
                        'email' => $employee->email,
                        'contact' => $employee->contact_number
                    ];
                }
            } elseif ($borrowerType === 'user') {
                $user = \App\Models\User::find($borrowerId);
                if ($user) {
                    return [
                        'name' => $user->name,
                        'id_number' => $user->id_number ?? 'N/A',
                        'email' => $user->email,
                        'contact' => $user->phone ?? null
                    ];
                }
            }

            return [
                'name' => 'Unknown',
                'id_number' => 'N/A',
                'email' => null,
                'contact' => null
            ];
        } catch (\Exception $e) {
            Log::error('Error getting borrower details', [
                'type' => $borrowerType,
                'id' => $borrowerId,
                'error' => $e->getMessage()
            ]);

            return [
                'name' => 'Error loading',
                'id_number' => 'N/A',
                'email' => null,
                'contact' => null
            ];
        }
    }

    /**
     * Update inspection status (simplified - just mark as inspected)
     */
    public function updateInspectionStatus(Request $request, $returnTransactionId): JsonResponse
    {
        try {
            Log::info('🔍 updateInspectionStatus called', [
                'return_transaction_id' => $returnTransactionId,
                'data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'admin_user_id' => 'required|integer|exists:admin,id',
                'inspection_status' => 'nullable|in:pending_inspection,inspected,good_condition,minor_damage,major_damage,lost,unusable',
                'condition' => 'nullable|in:excellent,good,fair,damaged,lost',
                'usability' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $returnTransaction = ReturnTransaction::with([
                'borrowTransaction.inventoryItem'
            ])->find($returnTransactionId);

            if (!$returnTransaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Return transaction not found'
                ], 404);
            }

            DB::beginTransaction();

            try {
                // Update condition if provided
                if ($request->has('condition') && $request->condition !== null) {
                    $returnTransaction->condition = $request->condition;
                    Log::info('📝 Updating condition', [
                        'return_transaction_id' => $returnTransactionId,
                        'old_condition' => $returnTransaction->getOriginal('condition'),
                        'new_condition' => $request->condition
                    ]);
                }

                // Get the final condition (updated or existing) for logic decisions
                $finalCondition = $returnTransaction->condition;

                // Map frontend 'inspected' status to database enum value
                // Frontend sends 'inspected', but database enum uses 'good_condition', 'minor_damage', etc.
                $dbInspectionStatus = $returnTransaction->inspection_status; // Keep current if not updating

                if ($request->has('inspection_status') && $request->inspection_status !== null) {
                    $dbInspectionStatus = $request->inspection_status;

                    // If frontend sends 'inspected', map it to appropriate enum value based on condition
                    if ($request->inspection_status === 'inspected') {
                        // Use the final condition (updated or existing) to determine inspection status
                        // Usable (excellent, good) and Partially Usable (fair) → good_condition
                        // Not Usable (damaged, lost) → minor_damage or major_damage
                        if (in_array($finalCondition, ['excellent', 'good', 'fair'])) {
                            $dbInspectionStatus = 'good_condition';
                        } elseif (in_array($finalCondition, ['damaged', 'lost'])) {
                            $dbInspectionStatus = 'minor_damage'; // Could be minor or major, defaulting to minor
                        } else {
                            $dbInspectionStatus = 'good_condition'; // Default to good_condition
                        }
                    }

                    // Update inspection status
                    $returnTransaction->inspection_status = $dbInspectionStatus;

                    // If marking as inspected (not pending), set inspected_by and inspected_at
                    if ($dbInspectionStatus !== 'pending_inspection') {
                        $returnTransaction->inspected_by = $request->admin_user_id;
                        $returnTransaction->inspected_at = now();
                    } else {
                        // If reverting to pending, clear inspection data
                        $returnTransaction->inspected_by = null;
                        $returnTransaction->inspected_at = null;
                    }
                }

                // Get original inspection status before save to detect if this is a new inspection
                $originalInspectionStatus = $returnTransaction->getOriginal('inspection_status') ?? $returnTransaction->inspection_status;
                $wasPendingBefore = ($originalInspectionStatus === 'pending_inspection');
                $originalCondition = $returnTransaction->getOriginal('condition') ?? $returnTransaction->condition;

                $returnTransaction->save();

                // INVENTORY QUANTITY RESTORATION LOGIC:
                // Restore quantity ONLY if item is inspected and marked as:
                // - Usable (excellent, good) OR Partially Usable (fair)
                // Do NOT restore if Not Usable (damaged, lost)
                $shouldRestoreQuantity = false;
                $quantityToRestore = 0;

                // Determine if we should restore quantity:
                // 1. Item was pending and is now being inspected as usable/partially usable (new inspection)
                // 2. Item was already inspected but condition changed from non-usable to usable/partially usable
                $isNewInspection = $wasPendingBefore && ($dbInspectionStatus !== 'pending_inspection');
                $conditionChangedToUsable = !in_array($originalCondition, ['excellent', 'good', 'fair'])
                    && in_array($finalCondition, ['excellent', 'good', 'fair']);

                // Check if inspection status indicates good condition (usable or partially usable)
                if ($dbInspectionStatus === 'good_condition') {
                    // Double-check condition to ensure it's actually usable or partially usable
                    if (in_array($finalCondition, ['excellent', 'good', 'fair'])) {
                        // Only restore if this is a new inspection OR condition changed to usable
                        if ($isNewInspection || $conditionChangedToUsable) {
                            $shouldRestoreQuantity = true;
                            $inventoryItem = $returnTransaction->borrowTransaction->inventoryItem;
                            $quantityToRestore = $returnTransaction->borrowTransaction->quantity;

                            // Restore the quantity to available inventory
                            $oldAvailableQuantity = $inventoryItem->available_quantity;
                            $inventoryItem->available_quantity += $quantityToRestore;
                            $inventoryItem->save();

                            Log::info('✅ Inventory quantity restored after inspection (Usable/Partially Usable)', [
                                'item_id' => $inventoryItem->id,
                                'item_name' => $inventoryItem->name,
                                'condition' => $finalCondition,
                                'quantity_restored' => $quantityToRestore,
                                'old_available_quantity' => $oldAvailableQuantity,
                                'new_available_quantity' => $inventoryItem->available_quantity,
                                'reason' => $isNewInspection ? 'New inspection' : 'Condition changed to usable'
                            ]);
                        } else {
                            // Already restored, no need to restore again
                            Log::info('ℹ️ Inventory quantity already restored - skipping duplicate restoration', [
                                'return_transaction_id' => $returnTransactionId,
                                'condition' => $finalCondition,
                                'original_condition' => $originalCondition,
                                'reason' => 'Item already inspected and quantity already restored'
                            ]);
                        }
                    }
                } else {
                    // Item is marked as damaged/lost/unusable - do NOT restore quantity
                    Log::info('⚠️ Inventory quantity NOT restored - Item is Not Usable', [
                        'return_transaction_id' => $returnTransactionId,
                        'condition' => $finalCondition,
                        'inspection_status' => $dbInspectionStatus,
                        'reason' => 'Item marked as damaged/lost/unusable - cannot be restored to inventory'
                    ]);
                }

                // Log activity: Inspection completed
                $usabilityStatus = in_array($finalCondition, ['excellent', 'good', 'fair'])
                    ? (in_array($finalCondition, ['excellent', 'good']) ? 'Usable' : 'Partially Usable')
                    : 'Not Usable';

                ActivityLog::log('inspection_completed', "Item inspection completed - Status: {$dbInspectionStatus} - Item: {$returnTransaction->borrowTransaction->inventoryItem->name} - Usability: {$usabilityStatus}", [
                    'category' => 'transaction',
                    'return_transaction_id' => $returnTransactionId,
                    'borrow_transaction_id' => $returnTransaction->borrow_transaction_id,
                    'inventory_item_id' => $returnTransaction->borrowTransaction->inventory_item_id,
                    'admin_user_id' => $request->admin_user_id,
                    'actor_type' => 'admin',
                    'actor_id' => $request->admin_user_id,
                    'actor_name' => 'Admin',
                    'metadata' => [
                        'inspection_status' => $dbInspectionStatus,
                        'condition' => $finalCondition,
                        'usability' => $usabilityStatus,
                        'quantity_restored' => $quantityToRestore,
                        'inventory_updated' => $shouldRestoreQuantity,
                    ],
                ]);

                DB::commit();

                Log::info('✅ Inspection status updated', [
                    'return_transaction_id' => $returnTransactionId,
                    'inspection_status' => $request->inspection_status
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Inspection status updated successfully',
                    'data' => $returnTransaction->load([
                        'borrowTransaction.inventoryItem'
                    ])
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('❌ Error updating inspection status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error updating inspection status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activity logs for analytics dashboard
     */
    public function getActivityLogs(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);
            $activityType = $request->get('type'); // Optional filter by activity type

            $query = ActivityLog::with([
                'borrowTransaction.inventoryItem',
                'returnTransaction.borrowTransaction.inventoryItem',
                'inventoryItem',
                'adminUser' // Load admin relationship to get actual admin name
            ])->orderBy('activity_date', 'desc');

            // Filter by activity type if provided
            if ($activityType) {
                $query->where('activity_type', $activityType);
            }

            $activityLogs = $query->limit($limit)->get()->map(function ($log) {
                // Get item name from various sources
                $itemName = 'Unknown Item';
                if ($log->inventoryItem) {
                    $itemName = $log->inventoryItem->name;
                } elseif ($log->borrowTransaction && $log->borrowTransaction->inventoryItem) {
                    $itemName = $log->borrowTransaction->inventoryItem->name;
                } elseif ($log->returnTransaction && $log->returnTransaction->borrowTransaction && $log->returnTransaction->borrowTransaction->inventoryItem) {
                    $itemName = $log->returnTransaction->borrowTransaction->inventoryItem->name;
                }

                // Map activity types to icons and action names
                $activityIcons = [
                    'borrow_request' => '📝',
                    'borrow_approved' => '✅',
                    'borrow_rejected' => '❌',
                    'return_submitted' => '📤',
                    'return_verified' => '↩️',
                    'inspection_completed' => '🔍',
                    'inventory_item_created' => '➕',
                    'inventory_item_updated' => '✏️',
                    'inventory_item_deleted' => '🗑️',
                ];

                $activityNames = [
                    'borrow_request' => 'Borrow Request',
                    'borrow_approved' => 'Borrowing Approved',
                    'borrow_rejected' => 'Borrow Request Rejected',
                    'return_submitted' => 'Return Submitted',
                    'return_verified' => 'Return Processed',
                    'inspection_completed' => 'Inspection Completed',
                    'inventory_item_created' => 'Item Created',
                    'inventory_item_updated' => 'Item Updated',
                    'inventory_item_deleted' => 'Item Deleted',
                ];

                $activityTypes = [
                    'borrow_request' => 'borrow',
                    'borrow_approved' => 'borrow',
                    'borrow_rejected' => 'borrow',
                    'return_submitted' => 'return',
                    'return_verified' => 'return',
                    'inspection_completed' => 'return',
                    'inventory_item_created' => 'inventory',
                    'inventory_item_updated' => 'inventory',
                    'inventory_item_deleted' => 'inventory',
                ];

                // Determine who performed the action
                $performedBy = 'System';
                $performedByType = 'system';

                if ($log->adminUser && $log->adminUser->full_name) {
                    // Admin performed the action
                    $performedBy = $log->adminUser->full_name;
                    $performedByType = 'admin';
                } elseif ($log->actor_name) {
                    // Use actor_name if available (could be admin name or user name)
                    $performedBy = $log->actor_name;
                    $performedByType = $log->actor_type ?? 'user';
                }

                // Format the "by" text based on who performed it
                $byText = $performedByType === 'admin'
                    ? "by: {$performedBy}"
                    : ($performedByType === 'system'
                        ? 'by System'
                        : "by {$performedBy}");

                return [
                    'id' => $log->id,
                    'action' => $activityNames[$log->activity_type] ?? $log->activity_type,
                    'details' => $log->description,
                    'user' => $performedBy,
                    'byText' => $byText,
                    'performedByType' => $performedByType,
                    'time' => $log->activity_date->diffForHumans(),
                    'timeFormatted' => $log->activity_date->format('Y-m-d H:i:s'),
                    'type' => $activityTypes[$log->activity_type] ?? 'other',
                    'icon' => $activityIcons[$log->activity_type] ?? '📋',
                    'activity_type' => $log->activity_type,
                    'item_name' => $itemName,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $activityLogs
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching activity logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent transactions (both borrow and return) for analytics dashboard
     * Updated to include return transactions and format for frontend
     */
    public function getRecentTransactionsForDashboard(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);

            // Get recent borrow transactions with eager loading
            $recentBorrows = BorrowTransaction::whereIn('status', ['borrowed', 'pending'])
                ->with(['inventoryItem'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            // Preload all admins that might be needed (avoid N+1 queries)
            $adminIds = $recentBorrows->pluck('approved_by')
                ->filter(fn($id) => is_numeric($id))
                ->unique()
                ->map(fn($id) => (int)$id)
                ->toArray();
            $admins = \App\Models\Admin::whereIn('id', $adminIds)->get()->keyBy('id');

            $recentBorrows = $recentBorrows->map(function ($transaction) use ($admins) {
                    // Get admin who approved (if approved)
                    $processedBy = null;
                    $processedByText = null;

                    if ($transaction->approved_by && $transaction->status === 'borrowed') {
                        // Check if approved_by is numeric (ID) or a string (name)
                        if (is_numeric($transaction->approved_by)) {
                            // It's an ID, get from pre-loaded admins collection
                            try {
                                $admin = $admins->get((int)$transaction->approved_by);
                                if ($admin && !empty($admin->full_name)) {
                                    $processedBy = $admin->full_name;
                                    $processedByText = "by: {$admin->full_name}";
                                } else {
                                    // Try to get from activity log as fallback
                                    // This is inside a loop, but ActivityLog queries are minimal and only executed when needed
                                    // Optimized: Only query if admin lookup failed
                                    $activityLog = ActivityLog::where('borrow_transaction_id', $transaction->id)
                                        ->where('activity_type', 'borrow_approved')
                                        ->with('adminUser') // Eager load admin relationship
                                        ->first();

                                    if ($activityLog && $activityLog->adminUser && !empty($activityLog->adminUser->full_name)) {
                                        $processedBy = $activityLog->adminUser->full_name;
                                        $processedByText = "by: {$activityLog->adminUser->full_name}";
                                    } elseif ($activityLog && !empty($activityLog->actor_name)) {
                                        $processedBy = $activityLog->actor_name;
                                        $processedByText = "by: {$activityLog->actor_name}";
                                    } else {
                                        // Admin not found, use generic text
                                        $processedBy = 'Admin';
                                        $processedByText = "by: Admin";
                                    }
                                }
                            } catch (\Exception $e) {
                                Log::warning("Failed to get admin name for approved_by: {$transaction->approved_by}", ['error' => $e->getMessage()]);
                                $processedBy = 'Admin';
                                $processedByText = "by: Admin";
                            }
                        } else {
                            // It's already a name string
                            $processedBy = $transaction->approved_by;
                            $processedByText = "by: {$transaction->approved_by}";
                        }
                    }

                    return [
                        'type' => 'borrow',
                        'item' => $transaction->inventoryItem->name ?? 'Unknown Item',
                        'user' => $transaction->borrower_name ?? 'Unknown User',
                        'userType' => ucfirst($transaction->borrower_type ?? 'user'),
                        'time' => $transaction->created_at->format('g:i A'),
                        'timeFormatted' => $transaction->created_at->format('Y-m-d H:i:s'),
                        'status' => $transaction->status === 'borrowed' ? 'active' : 'pending',
                        'dueDate' => $transaction->expected_return_date ? $transaction->expected_return_date->format('M d, Y') : null,
                        'transaction_id' => $transaction->transaction_id,
                        'processedBy' => $processedBy,
                        'processedByText' => $processedByText,
                    ];
                });

            // Get recent return transactions with eager loading
            $recentReturns = ReturnTransaction::with([
                'borrowTransaction.inventoryItem',
                'borrowTransaction',
                'inspectedByUser' // Load the user who inspected
            ])
                ->orderBy('return_date', 'desc')
                ->limit($limit)
                ->get();

            // Preload all admins that might be needed for inspected_by (avoid N+1 queries)
            $inspectedByAdminIds = $recentReturns->pluck('inspected_by')
                ->filter(fn($id) => is_numeric($id))
                ->unique()
                ->map(fn($id) => (int)$id)
                ->toArray();
            $inspectedByAdmins = \App\Models\Admin::whereIn('id', $inspectedByAdminIds)->get()->keyBy('id');

            $recentReturns = $recentReturns->map(function ($return) use ($inspectedByAdmins) {
                    $borrowTransaction = $return->borrowTransaction;

                    // Get who processed/inspected the return
                    $processedBy = null;
                    $processedByText = null;

                    if ($return->inspected_by) {
                        // Check if inspected_by is numeric (ID)
                        if (is_numeric($return->inspected_by)) {
                            try {
                                // Get from pre-loaded admins collection
                                $admin = $inspectedByAdmins->get((int)$return->inspected_by);
                                if ($admin && !empty($admin->full_name)) {
                                    $processedBy = $admin->full_name;
                                    $processedByText = "by: {$admin->full_name}";
                                } elseif ($return->inspectedByUser && !empty($return->inspectedByUser->full_name)) {
                                    // Fallback to user name
                                    $processedBy = $return->inspectedByUser->full_name;
                                    $processedByText = "by: {$processedBy}";
                                } else {
                                    // Try to get from activity log as fallback
                                    // This is inside a loop, but ActivityLog queries are minimal and only executed when needed
                                    // Optimized: Only query if admin lookup failed
                                    $activityLog = ActivityLog::where('return_transaction_id', $return->id)
                                        ->whereIn('activity_type', ['return_verified', 'inspection_completed'])
                                        ->with('adminUser') // Eager load admin relationship
                                        ->orderBy('activity_date', 'desc')
                                        ->first();

                                    if ($activityLog && $activityLog->adminUser && !empty($activityLog->adminUser->full_name)) {
                                        $processedBy = $activityLog->adminUser->full_name;
                                        $processedByText = "by: {$activityLog->adminUser->full_name}";
                                    } elseif ($activityLog && !empty($activityLog->actor_name)) {
                                        $processedBy = $activityLog->actor_name;
                                        $processedByText = "by: {$activityLog->actor_name}";
                                    } else {
                                        // Neither found, use generic
                                        $processedBy = 'Admin';
                                        $processedByText = "by: Admin";
                                    }
                                }
                            } catch (\Exception $e) {
                                Log::warning("Failed to get admin/user name for inspected_by: {$return->inspected_by}", ['error' => $e->getMessage()]);
                                $processedBy = 'Admin';
                                $processedByText = "by: Admin";
                            }
                        } else {
                            // It's already a name string
                            $processedBy = $return->inspected_by;
                            $processedByText = "by: {$return->inspected_by}";
                        }
                    } elseif ($return->received_by) {
                        // Use received_by as fallback
                        $processedBy = $return->received_by;
                        $processedByText = "by: {$return->received_by}";
                    }

                    return [
                        'type' => 'return',
                        'item' => $borrowTransaction && $borrowTransaction->inventoryItem
                            ? $borrowTransaction->inventoryItem->name
                            : 'Unknown Item',
                        'user' => $borrowTransaction ? ($borrowTransaction->borrower_name ?? 'Unknown User') : 'Unknown User',
                        'userType' => $borrowTransaction ? ucfirst($borrowTransaction->borrower_type ?? 'user') : 'Unknown',
                        'time' => $return->return_date ? Carbon::parse($return->return_date)->format('g:i A') : $return->created_at->format('g:i A'),
                        'timeFormatted' => $return->return_date ? Carbon::parse($return->return_date)->format('Y-m-d H:i:s') : $return->created_at->format('Y-m-d H:i:s'),
                        'status' => 'completed',
                        'returnCondition' => ucfirst($return->condition ?? 'Good'),
                        'transaction_id' => $borrowTransaction ? $borrowTransaction->transaction_id : null,
                        'processedBy' => $processedBy,
                        'processedByText' => $processedByText,
                    ];
                });

            // Combine and sort by time
            $allTransactions = $recentBorrows->concat($recentReturns)
                ->sortByDesc('timeFormatted')
                ->take($limit)
                ->values();

            return response()->json([
                'success' => true,
                'data' => $allTransactions
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching recent transactions for dashboard: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recent transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get calendar data for due dates and return dates
     * Returns active borrows (with expected_return_date) and returned items (with return_date)
     */
    public function getCalendarData(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            $today = now()->toDateString();

            // Get active borrows (due dates) - from BorrowTransaction directly to include pending, borrowed, and pending_return_verification
            $activeBorrows = BorrowTransaction::with(['inventoryItem'])
                ->whereIn('status', ['pending', 'borrowed', 'pending_return_verification'])
                ->whereNotNull('expected_return_date')
                ->get()
                ->map(function($transaction) use ($today) {
                    $item = $transaction->inventoryItem ?? null;
                    $expectedReturnDate = $transaction->expected_return_date;

                    // Determine status based on due date
                    $status = 'upcoming';
                    if ($expectedReturnDate) {
                        $dueDateStr = $expectedReturnDate instanceof \Carbon\Carbon
                            ? $expectedReturnDate->toDateString()
                            : $expectedReturnDate;

                        if ($dueDateStr < $today) {
                            $status = 'overdue';
                        } elseif ($dueDateStr === $today) {
                            $status = 'due-today';
                        }
                    }

                    // Format date consistently as Y-m-d string
                    $formattedDate = null;
                    if ($expectedReturnDate) {
                        if ($expectedReturnDate instanceof \Carbon\Carbon) {
                            $formattedDate = $expectedReturnDate->format('Y-m-d');
                        } elseif (is_string($expectedReturnDate)) {
                            // If it's already a string, try to parse and reformat
                            try {
                                $formattedDate = \Carbon\Carbon::parse($expectedReturnDate)->format('Y-m-d');
                            } catch (\Exception $e) {
                                $formattedDate = $expectedReturnDate; // Use as-is if parsing fails
                            }
                        } else {
                            $formattedDate = $expectedReturnDate;
                        }
                    }

                    return [
                        'id' => $transaction->id,
                        'type' => 'due', // Indicates this is a due date
                        'date' => $formattedDate,
                        'item' => $item ? $item->name : 'Unknown Item',
                        'item_category' => $item ? $item->category : 'N/A',
                        'borrower' => $transaction->borrower_name ?? 'Unknown',
                        'borrower_type' => ucfirst($transaction->borrower_type ?? 'user'),
                        'borrower_id' => $transaction->borrower_id_number ?? '',
                        'quantity' => $transaction->quantity ?? 1,
                        'status' => $status,
                        'transaction_status' => $transaction->status, // Include original transaction status
                        'transaction_id' => $transaction->transaction_id ?? '',
                        'borrow_date' => $transaction->borrow_date ? ($transaction->borrow_date instanceof \Carbon\Carbon
                            ? $transaction->borrow_date->toDateString()
                            : $transaction->borrow_date) : null,
                    ];
                })
                ->filter(function($item) {
                    return $item['date'] !== null; // Only include items with valid dates
                });

            // Get returned items (return dates) - from ReturnTransaction
            $returnedItems = \App\Models\ReturnTransaction::with([
                'borrowTransaction.inventoryItem'
            ])
                ->whereNotNull('return_date')
                ->get()
                ->map(function($return) {
                    $transaction = $return->borrowTransaction;
                    $item = $transaction ? $transaction->inventoryItem : null;

                    return [
                        'id' => $return->id,
                        'type' => 'returned', // Indicates this is a return date
                        'date' => $return->return_date ? ($return->return_date instanceof \Carbon\Carbon
                            ? $return->return_date->toDateString()
                            : $return->return_date) : null,
                        'item' => $item ? $item->name : 'Unknown Item',
                        'item_category' => $item ? $item->category : 'N/A',
                        'borrower' => $transaction ? ($transaction->borrower_name ?? 'Unknown') : 'Unknown',
                        'borrower_type' => $transaction ? ucfirst($transaction->borrower_type ?? 'user') : 'User',
                        'borrower_id' => $transaction ? ($transaction->borrower_id_number ?? '') : '',
                        'quantity' => $transaction ? ($transaction->quantity ?? 1) : 1,
                        'status' => 'returned',
                        'transaction_id' => $transaction ? ($transaction->transaction_id ?? '') : '',
                        'inspection_status' => $return->inspection_status ?? 'pending_inspection',
                        'condition' => $return->condition ?? 'good',
                    ];
                })
                ->filter(function($item) {
                    return $item['date'] !== null; // Only include items with valid dates
                });

            // Filter by date range if provided
            if ($startDate) {
                $activeBorrows = $activeBorrows->filter(function($item) use ($startDate) {
                    return $item['date'] >= $startDate;
                });
                $returnedItems = $returnedItems->filter(function($item) use ($startDate) {
                    return $item['date'] >= $startDate;
                });
            }

            if ($endDate) {
                $activeBorrows = $activeBorrows->filter(function($item) use ($endDate) {
                    return $item['date'] <= $endDate;
                });
                $returnedItems = $returnedItems->filter(function($item) use ($endDate) {
                    return $item['date'] <= $endDate;
                });
            }

            // Combine and sort by date
            $allCalendarItems = $activeBorrows->concat($returnedItems)->sortBy('date')->values();

            // Calculate summary statistics
            $overdueCount = $activeBorrows->where('status', 'overdue')->count();
            $dueTodayCount = $activeBorrows->where('status', 'due-today')->count();
            $upcomingCount = $activeBorrows->where('status', 'upcoming')->count();
            $returnedCount = $returnedItems->count();

            // Log calendar data fetch (only in debug mode)
            if (config('app.debug')) {
                Log::info('Calendar data fetched', [
                    'active_borrows' => $activeBorrows->count(),
                    'returned_items' => $returnedItems->count(),
                    'total_items' => $allCalendarItems->count()
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $allCalendarItems,
                'summary' => [
                    'overdue' => $overdueCount,
                    'due_today' => $dueTodayCount,
                    'upcoming' => $upcomingCount,
                    'returned' => $returnedCount,
                    'total' => $allCalendarItems->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error fetching calendar data: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve calendar data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
