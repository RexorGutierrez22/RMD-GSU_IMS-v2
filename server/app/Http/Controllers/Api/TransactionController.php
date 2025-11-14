<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\InventoryItem;
use App\Models\BorrowTransaction;
use App\Models\ReturnTransaction;
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
                    $query->where('status', $request->status);
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

            foreach ($request->returns as $returnData) {
                $borrowTransaction = BorrowTransaction::find($returnData['borrow_transaction_id']);

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

            $transaction = BorrowTransaction::findOrFail($transactionId);

            // Check if already approved or rejected
            if ($transaction->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been ' . $transaction->status
                ], 400);
            }

            // Get the inventory item
            $inventoryItem = InventoryItem::find($transaction->inventory_item_id);

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

            // Update transaction status
            $transaction->status = 'borrowed';
            $transaction->approved_by = auth()->user()->id ?? 'Admin'; // TODO: Get authenticated admin
            $transaction->approved_at = now();
            $transaction->save();

            // Decrement inventory quantity NOW that it's approved
            $inventoryItem->borrowQuantity($transaction->quantity);

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

            // Update transaction status
            $transaction->status = 'rejected';
            $transaction->notes = ($transaction->notes ? $transaction->notes . "\n\n" : '') .
                                  'Rejection reason: ' . ($request->reason ?? 'Not specified');
            $transaction->save();

            // Do NOT decrement inventory - request was rejected

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
            $transaction = BorrowTransaction::find($transactionId);

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

            // Get all returned transactions - use student/employee relationships
            $query = BorrowTransaction::with([
                'student',           // Added for student borrowers
                'employee',          // Added for employee borrowers
                'inventoryItem',
                'returnTransaction'
            ])->where('status', 'returned');

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    // Search in students
                    $q->whereHas('student', function($userQuery) use ($search) {
                        $userQuery->where('first_name', 'like', '%' . $search . '%')
                                  ->orWhere('last_name', 'like', '%' . $search . '%')
                                  ->orWhere('id_number', 'like', '%' . $search . '%');
                    })
                    // Search in employees
                    ->orWhereHas('employee', function($userQuery) use ($search) {
                        $userQuery->where('first_name', 'like', '%' . $search . '%')
                                  ->orWhere('last_name', 'like', '%' . $search . '%')
                                  ->orWhere('emp_id', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('inventoryItem', function($itemQuery) use ($search) {
                        $itemQuery->where('name', 'like', '%' . $search . '%');
                    });
                });
            }

            $returnedItems = $query->orderBy('actual_return_date', 'desc')->get();

            Log::info('📦 Found returned items (before filtering)', [
                'count' => $returnedItems->count()
            ]);

            // Format the data for frontend - Filter out items with missing relationships
            $formattedItems = $returnedItems->map(function($transaction) {
                // Get user from student or employee table
                $user = $transaction->student ?? $transaction->employee;
                $item = $transaction->inventoryItem;
                $returnInfo = $transaction->returnTransaction;

                // Skip if essential data missing
                if (!$user || !$item || !$returnInfo) {
                    Log::warning('⚠️ Skipping transaction with missing relationships', [
                        'id' => $transaction->id,
                        'has_user' => !!$user,
                        'has_item' => !!$item,
                        'has_return' => !!$returnInfo
                    ]);
                    return null;
                }

                return [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->transaction_id,
                    'item_name' => $item->name,
                    'item_category' => $item->category,
                    'item_details' => $item->description,
                    'quantity' => $transaction->quantity,
                    'returner_name' => $user->first_name . ' ' . $user->last_name,
                    'returner_id' => $user->id_number ?? $user->emp_id ?? 'N/A',
                    'returner_type' => $transaction->borrower_type ?? 'N/A',
                    'returner_email' => $user->email,
                    'returner_contact' => $user->contact_number ?? 'N/A',
                    'borrow_date' => $transaction->borrow_date,
                    'expected_return_date' => $transaction->expected_return_date,
                    'actual_return_date' => $transaction->actual_return_date,
                    'return_condition' => $returnInfo->condition ?? 'N/A',
                    'return_notes' => $returnInfo->return_notes ?? '',
                    'damage_fee' => $returnInfo->damage_fee ?? 0,
                    'received_by' => $returnInfo->received_by ?? 'N/A',
                    'inspection_status' => $returnInfo->inspection_status ?? 'pending_inspection',
                    'purpose' => $transaction->purpose,
                    'location' => $transaction->location,
                    'status' => 'Returned',
                    'days_borrowed' => Carbon::parse($transaction->borrow_date)->diffInDays($transaction->actual_return_date)
                ];
            })->filter()->values(); // Remove nulls and re-index

            Log::info('✅ Formatted returned items', [
                'count' => $formattedItems->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $formattedItems,
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
            $transaction = BorrowTransaction::find($transactionId);

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
                return response()->json([
                    'success' => true,
                    'message' => 'Item marked as returned successfully',
                    'data' => $transaction->load(['returnTransaction', 'inventoryItem', 'user'])
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

            $returns = $query->orderBy('return_date', 'desc')->get();

            // Enrich with borrower information
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

            Log::info('📦 Found returns for inspection', ['count' => $enrichedReturns->count()]);

            return response()->json([
                'success' => true,
                'message' => 'Returned items retrieved successfully',
                'data' => $enrichedReturns
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
}
