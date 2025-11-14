<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReturnVerification;
use App\Models\BorrowTransaction;
use App\Models\ReturnTransaction;
use App\Models\InventoryItem;
use App\Helpers\UserHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReturnVerificationController extends Controller
{
    /**
     * Get all pending verifications (Return Verification Lounge)
     */
    public function getPendingVerifications(Request $request)
    {
        try {
            Log::info('🔍 getPendingVerifications called');

            $verifications = ReturnVerification::with([
                'borrowTransaction',
                'inventoryItem',
                'verifiedByUser'
            ])
            ->pendingVerification()
            ->orderBy('created_at', 'desc')
            ->get();

            Log::info('📦 Found pending verifications', ['count' => $verifications->count()]);

            return response()->json([
                'success' => true,
                'message' => 'Pending verifications retrieved successfully',
                'data' => $verifications
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error getting pending verifications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending verifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all verifications (with filters)
     * By default, only shows pending verifications for the Return Verification dashboard
     */
    public function getAllVerifications(Request $request)
    {
        try {
            $status = $request->get('status');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            Log::info('🔍 getAllVerifications called', [
                'status' => $status,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            $query = ReturnVerification::with([
                'borrowTransaction',
                'inventoryItem',
                'verifiedByUser',
                'returnTransaction'
            ]);

            // ✅ BY DEFAULT: Only show pending verifications
            // This ensures Return Verification dashboard only shows items waiting for verification
            if ($status) {
                $query->where('verification_status', $status);
            } else {
                // Default to pending_verification only
                $query->where('verification_status', 'pending_verification');
                Log::info('📋 Filtering to pending_verification by default');
            }

            // Filter by date range
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            $verifications = $query->orderBy('created_at', 'desc')->get();

            Log::info('✅ Found verifications', [
                'count' => $verifications->count(),
                'statuses' => $verifications->pluck('verification_status')->unique()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verifications retrieved successfully',
                'data' => $verifications
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error getting all verifications', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving verifications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create return verification (when user submits return request)
     */
    public function createReturnVerification(Request $request)
    {
        try {
            Log::info('🔍 createReturnVerification called', ['data' => $request->all()]);

            $validator = Validator::make($request->all(), [
                'user_qr_code' => 'required|string',
                'item_ids' => 'required|array',
                'item_ids.*' => 'required|integer|exists:borrow_transactions,id',
                'return_notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find user by QR code
            $userResult = UserHelper::findUserByQrCode($request->user_qr_code);

            if (!$userResult) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found. Please ensure you are registered in the system.'
                ], 404);
            }

            $user = $userResult['user'];
            $userType = $userResult['type'];

            Log::info('✅ User found for return verification', [
                'user_id' => $user->id,
                'user_type' => $userType,
                'item_count' => count($request->item_ids)
            ]);

            DB::beginTransaction();

            try {
                $createdVerifications = [];

                foreach ($request->item_ids as $borrowTransactionId) {
                    // Get borrow transaction
                    $borrowTransaction = BorrowTransaction::with('inventoryItem')->find($borrowTransactionId);

                    if (!$borrowTransaction) {
                        Log::warning('⚠️ Borrow transaction not found', ['id' => $borrowTransactionId]);
                        continue;
                    }

                    // Verify this transaction belongs to the user
                    if ($borrowTransaction->borrower_id != $user->id ||
                        $borrowTransaction->borrower_type != $userType) {
                        Log::warning('⚠️ Borrow transaction does not belong to user', [
                            'transaction_id' => $borrowTransactionId,
                            'expected_user' => $user->id,
                            'actual_user' => $borrowTransaction->borrower_id
                        ]);
                        continue;
                    }

                    // Check if already verified or returned
                    if ($borrowTransaction->status !== 'borrowed') {
                        Log::warning('⚠️ Item not in borrowed status', [
                            'transaction_id' => $borrowTransactionId,
                            'status' => $borrowTransaction->status
                        ]);
                        continue;
                    }

                    // Create return verification record
                    $verification = ReturnVerification::create([
                        'borrower_type' => $userType,
                        'borrower_id' => $user->id,
                        'borrower_name' => $this->getUserFullName($user, $userType),
                        'borrower_id_number' => $this->getUserIdNumber($user, $userType),
                        'borrower_email' => $user->email ?? null,
                        'borrower_contact' => $user->contact_number ?? $user->phone ?? null,
                        'borrow_transaction_id' => $borrowTransaction->id,
                        'inventory_item_id' => $borrowTransaction->inventory_item_id,
                        'item_name' => $borrowTransaction->inventoryItem->name,
                        'item_category' => $borrowTransaction->inventoryItem->category ?? null,
                        'quantity_returned' => $borrowTransaction->quantity,
                        'return_date' => Carbon::now()->toDateString(),
                        'returned_by' => $this->getUserFullName($user, $userType),
                        'return_notes' => $request->return_notes,
                        'verification_status' => 'pending_verification'
                    ]);

                    // Update borrow transaction status to pending_return_verification
                    $borrowTransaction->status = 'pending_return_verification';
                    $borrowTransaction->save();

                    $createdVerifications[] = $verification;

                    Log::info('✅ Return verification created', [
                        'verification_id' => $verification->verification_id,
                        'item' => $borrowTransaction->inventoryItem->name
                    ]);
                }

                if (empty($createdVerifications)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'No valid items to create return verification'
                    ], 400);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Return verification created successfully. Please wait for admin confirmation.',
                    'data' => [
                        'verifications' => $createdVerifications,
                        'count' => count($createdVerifications)
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('❌ Error creating return verification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error creating return verification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify return (Admin confirms items received)
     */
    public function verifyReturn(Request $request, $verificationId)
    {
        try {
            Log::info('🔍 verifyReturn called', [
                'verification_id' => $verificationId,
                'data' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'admin_user_id' => 'required|integer|exists:admin,id',
                'verification_notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $verification = ReturnVerification::find($verificationId);

            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Return verification not found'
                ], 404);
            }

            if (!$verification->isPending()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Return verification already processed'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Mark verification as verified
                $verification->markAsVerified(
                    $request->admin_user_id,
                    $request->verification_notes
                );

                // Create return transaction (moves to Returned Items table)
                $returnTransaction = ReturnTransaction::create([
                    'borrow_transaction_id' => $verification->borrow_transaction_id,
                    'return_verification_id' => $verification->id,
                    'return_date' => $verification->return_date,
                    'condition' => 'good', // Default to 'good' until inspection (valid ENUM: excellent, good, fair, damaged, lost)
                    'return_notes' => $verification->return_notes,
                    'received_by' => $request->admin_user_id,
                    'inspection_status' => 'pending_inspection',
                    'damage_fee' => 0
                ]);

                // Update borrow transaction status
                $borrowTransaction = $verification->borrowTransaction;
                $borrowTransaction->status = 'returned';
                $borrowTransaction->save();

                // Restore inventory quantity
                $inventoryItem = $verification->inventoryItem;
                $inventoryItem->available_quantity += $verification->quantity_returned;
                $inventoryItem->save();

                DB::commit();

                Log::info('✅ Return verified successfully', [
                    'verification_id' => $verification->verification_id,
                    'return_transaction_id' => $returnTransaction->id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Return verified successfully. Item moved to Returned Items for inspection.',
                    'data' => [
                        'verification' => $verification,
                        'return_transaction' => $returnTransaction
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('❌ Error verifying return', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error verifying return: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject return verification
     */
    public function rejectReturn(Request $request, $verificationId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'admin_user_id' => 'required|integer|exists:admin,id',
                'rejection_reason' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $verification = ReturnVerification::find($verificationId);

            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Return verification not found'
                ], 404);
            }

            DB::beginTransaction();

            try {
                // Reject verification
                $verification->reject(
                    $request->admin_user_id,
                    $request->rejection_reason
                );

                // Reset borrow transaction status back to borrowed
                $borrowTransaction = $verification->borrowTransaction;
                $borrowTransaction->status = 'borrowed';
                $borrowTransaction->save();

                DB::commit();

                Log::info('✅ Return rejected', [
                    'verification_id' => $verification->verification_id,
                    'reason' => $request->rejection_reason
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Return verification rejected',
                    'data' => $verification
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('❌ Error rejecting return', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Error rejecting return: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check verification status (for user polling)
     */
    public function checkVerificationStatus(Request $request)
    {
        try {
            Log::info('📡 Checking verification status', [
                'request' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'verification_ids' => 'required|array',
                'verification_ids.*' => 'required|integer'
            ]);

            if ($validator->fails()) {
                Log::warning('⚠️ Validation failed for checkVerificationStatus', [
                    'errors' => $validator->errors()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $verifications = ReturnVerification::whereIn('id', $request->verification_ids)
                ->get(['id', 'verification_id', 'verification_status', 'verified_at', 'rejection_reason']);

            Log::info('📊 Found verifications', [
                'count' => $verifications->count(),
                'verifications' => $verifications->map(fn($v) => [
                    'id' => $v->id,
                    'status' => $v->verification_status,
                    'verified_at' => $v->verified_at
                ])
            ]);

            $allVerified = $verifications->every(fn($v) => $v->isVerified());
            $anyRejected = $verifications->some(fn($v) => $v->isRejected());

            $responseData = [
                'success' => true,
                'data' => [
                    'verifications' => $verifications,
                    'all_verified' => $allVerified,
                    'any_rejected' => $anyRejected,
                    'can_close' => $allVerified || $anyRejected
                ]
            ];

            Log::info('✅ Verification status check response', [
                'all_verified' => $allVerified,
                'any_rejected' => $anyRejected,
                'can_close' => $allVerified || $anyRejected
            ]);

            return response()->json($responseData);

        } catch (\Exception $e) {
            Log::error('❌ Error checking verification status', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error checking status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Get user full name
     */
    private function getUserFullName($user, $userType)
    {
        if ($userType === 'student' || $userType === 'employee') {
            return trim($user->first_name . ' ' . ($user->middle_name ?? '') . ' ' . $user->last_name);
        }
        return $user->name ?? 'Unknown';
    }

    /**
     * Helper: Get user ID number
     */
    private function getUserIdNumber($user, $userType)
    {
        if ($userType === 'student') {
            return $user->student_id ?? '';
        } elseif ($userType === 'employee') {
            return $user->employee_id ?? '';
        }
        return $user->id_number ?? '';
    }
}
