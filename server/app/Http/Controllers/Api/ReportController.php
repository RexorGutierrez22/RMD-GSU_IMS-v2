<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\AdminExport;
use App\Exports\InventoryExport;
use App\Exports\TransactionsExport;
use App\Exports\UsersExport;
use App\Models\BorrowTransaction;
use App\Models\InventoryItem;
use App\Models\ReturnTransaction;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\Admin;
use App\Models\SuperAdmin;

class ReportController extends Controller
{
    /**
     * Check if user is authenticated (Admin or SuperAdmin)
     */
    protected function checkAuth(Request $request)
    {
        // Get the bearer token
        $token = $request->bearerToken();

        if (!$token) {
            Log::warning('Report request without token', [
                'headers' => $request->headers->all()
            ]);
            return response()->json(['error' => 'Unauthenticated. No token provided.'], 401);
        }

        $user = null;

        // Check if this is a superadmin token (format: superadmin_token_TIMESTAMP_ID)
        if (strpos($token, 'superadmin_token_') === 0) {
            // Extract superadmin ID from token
            $parts = explode('_', $token);
            if (count($parts) >= 3) {
                $superAdminId = end($parts);

                // Find superadmin using Eloquent model
                $user = SuperAdmin::find($superAdminId);

                if ($user) {
                    Log::info('SuperAdmin authenticated via custom token', [
                        'superadmin_id' => $user->id,
                        'username' => $user->username
                    ]);
                } else {
                    Log::warning('SuperAdmin token valid format but user not found', [
                        'superadmin_id' => $superAdminId
                    ]);
                    return response()->json(['error' => 'Unauthenticated. SuperAdmin not found.'], 401);
                }
            } else {
                Log::warning('SuperAdmin token invalid format', [
                    'token_prefix' => substr($token, 0, 30) . '...'
                ]);
                return response()->json(['error' => 'Unauthenticated. Invalid token format.'], 401);
            }
        } elseif (strpos($token, 'default_admin_token_') === 0) {
            // Allow fallback dev/admin tokens when backend auth is offline
            $user = new Admin();
            $user->id = 0;
            $user->full_name = 'Default Admin';
            $user->username = 'default_admin';
            $user->email = 'default@admin.local';

            Log::notice('Default admin token used for report access');
        } else {
            // Try to find as Sanctum token (for Admin users)
            $accessToken = PersonalAccessToken::findToken($token);

            if (!$accessToken) {
                Log::warning('Report request with invalid token', [
                    'token_prefix' => substr($token, 0, 20) . '...'
                ]);
                return response()->json(['error' => 'Unauthenticated. Invalid token.'], 401);
            }

            // Get the tokenable (user) model
            $user = $accessToken->tokenable;

            if (!$user) {
                Log::warning('Report request with token but no user', [
                    'token_id' => $accessToken->id
                ]);
                return response()->json(['error' => 'Unauthenticated. User not found.'], 401);
            }
        }

        // Allow Admin or SuperAdmin models
        $allowedModels = [Admin::class, SuperAdmin::class];
        if (!in_array(get_class($user), $allowedModels)) {
            Log::warning('Report request from unauthorized user type', [
                'user_type' => get_class($user),
                'user_id' => $user->id ?? 'unknown'
            ]);
            return response()->json(['error' => 'Unauthorized. Admin or SuperAdmin access required.'], 403);
        }

        // Set the authenticated user on the request for use in the controller
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return null; // Auth passed
    }

    /**
     * Generate PDF report for inventory summary
     */
    public function inventoryPDF(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            $inventory = InventoryItem::query()
                ->orderBy('name')
                ->get();

            $stats = [
                'total_items' => $inventory->count(),
                'total_quantity' => $inventory->sum('total_quantity'),
                'available_quantity' => $inventory->sum('available_quantity'),
                'low_stock_count' => $inventory->filter(function ($item) {
                    return $item->isLowStock();
                })->count(),
            ];

            $data = [
                'title' => 'Inventory Summary Report',
                'date' => Carbon::now()->format('F d, Y'),
                'inventory' => $inventory,
                'stats' => $stats,
            ];

            $pdf = Pdf::loadView('reports.inventory', $data);
            return $pdf->download('inventory-report-' . Carbon::now()->format('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate PDF report for borrow transactions
     */
    public function borrowPDF(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            [$startDate, $endDate] = $this->resolveDateRange($request);

            $transactions = BorrowTransaction::with(['user', 'inventoryItem'])
                ->whereBetween('borrow_date', [$startDate, $endDate])
                ->orderBy('borrow_date', 'desc')
                ->get();

            $stats = [
                'total_borrows' => $transactions->count(),
                'pending' => $transactions->where('status', 'pending')->count(),
                'borrowed' => $transactions->where('status', 'borrowed')->count(),
                'returned' => $transactions->where('status', 'returned')->count(),
                'overdue' => $transactions->where('status', 'overdue')->count(),
            ];

            $data = [
                'title' => 'Borrow Transactions Report',
                'date' => Carbon::now()->format('F d, Y'),
                'start_date' => Carbon::parse($startDate)->format('F d, Y'),
                'end_date' => Carbon::parse($endDate)->format('F d, Y'),
                'transactions' => $transactions,
                'stats' => $stats,
            ];

            $pdf = Pdf::loadView('reports.borrow', $data);
            return $pdf->download('borrow-report-' . $startDate . '-to-' . $endDate . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate PDF report for return transactions
     */
    public function returnPDF(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            [$startDate, $endDate] = $this->resolveDateRange($request);

            $returns = ReturnTransaction::with(['borrowTransaction.user', 'borrowTransaction.inventoryItem'])
                ->whereBetween('return_date', [$startDate, $endDate])
                ->orderBy('return_date', 'desc')
                ->get();

            $stats = [
                'total_returns' => $returns->count(),
                'excellent' => $returns->where('condition', 'excellent')->count(),
                'good' => $returns->where('condition', 'good')->count(),
                'fair' => $returns->where('condition', 'fair')->count(),
                'damaged' => $returns->where('condition', 'damaged')->count(),
            ];

            $data = [
                'title' => 'Return Transactions Report',
                'date' => Carbon::now()->format('F d, Y'),
                'start_date' => Carbon::parse($startDate)->format('F d, Y'),
                'end_date' => Carbon::parse($endDate)->format('F d, Y'),
                'returns' => $returns,
                'stats' => $stats,
            ];

            $pdf = Pdf::loadView('reports.return', $data);
            return $pdf->download('return-report-' . $startDate . '-to-' . $endDate . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate PDF report for users
     */
    public function usersPDF(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            $type = $request->input('type', 'all'); // all, student, employee
            if (!in_array($type, ['all', 'student', 'employee'])) {
                throw ValidationException::withMessages([
                    'type' => 'The user type must be all, student, or employee.'
                ]);
            }

            $query = User::query();

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            $users = $query->orderBy('last_name')->get();

            $stats = [
                'total_users' => $users->count(),
                'students' => $users->where('type', 'student')->count(),
                'employees' => $users->where('type', 'employee')->count(),
                'active' => $users->where('status', 'active')->count(),
                'inactive' => $users->where('status', 'inactive')->count(),
            ];

            $data = [
                'title' => 'Users Report',
                'date' => Carbon::now()->format('F d, Y'),
                'type' => $type,
                'users' => $users,
                'stats' => $stats,
            ];

            $pdf = Pdf::loadView('reports.users', $data);
            $filename = 'users-report-' . ($type !== 'all' ? $type . '-' : '') . Carbon::now()->format('Y-m-d') . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export inventory to Excel
     */
    public function inventoryExcel(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            return Excel::download(new InventoryExport(), 'inventory-export-' . Carbon::now()->format('Y-m-d') . '.xlsx');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export Excel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export users to Excel
     */
    public function usersExcel(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            $type = $request->input('type', 'all');
            if (!in_array($type, ['all', 'student', 'employee'])) {
                throw ValidationException::withMessages([
                    'type' => 'The user type must be all, student, or employee.'
                ]);
            }
            return Excel::download(new UsersExport($type), 'users-export-' . ($type !== 'all' ? $type . '-' : '') . Carbon::now()->format('Y-m-d') . '.xlsx');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export Excel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export admin/staff to Excel
     */
    public function adminExcel(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            return Excel::download(new AdminExport(), 'admin-staff-export-' . Carbon::now()->format('Y-m-d') . '.xlsx');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export Excel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export transactions to Excel
     */
    public function transactionsExcel(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            [$startDate, $endDate] = $this->resolveDateRange($request);
            return Excel::download(new TransactionsExport($startDate, $endDate), 'transactions-export-' . $startDate . '-to-' . $endDate . '.xlsx');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export Excel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get overdue items report
     */
    public function overduePDF(Request $request)
    {
        $authCheck = $this->checkAuth($request);
        if ($authCheck) {
            return $authCheck;
        }

        try {
            $overdue = BorrowTransaction::with(['user', 'inventoryItem'])
                ->where('status', '!=', 'returned')
                ->where('expected_return_date', '<', Carbon::now())
                ->orderBy('expected_return_date', 'asc')
                ->get();

            $stats = [
                'total_overdue' => $overdue->count(),
                'total_items' => $overdue->sum('quantity'),
            ];

            $data = [
                'title' => 'Overdue Items Report',
                'date' => Carbon::now()->format('F d, Y'),
                'overdue' => $overdue,
                'stats' => $stats,
            ];

            $pdf = Pdf::loadView('reports.overdue', $data);
            return $pdf->download('overdue-report-' . Carbon::now()->format('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Validate and normalize the requested date range.
     */
    private function resolveDateRange(Request $request): array
    {
        $defaultStart = Carbon::now()->subDays(30)->toDateString();
        $defaultEnd = Carbon::now()->toDateString();

        $startInput = $request->input('start_date', $defaultStart);
        $endInput = $request->input('end_date', $defaultEnd);

        $start = Carbon::parse($startInput)->startOfDay();
        $end = Carbon::parse($endInput)->endOfDay();

        if ($start->gt($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start->toDateString(), $end->toDateString()];
    }
}

