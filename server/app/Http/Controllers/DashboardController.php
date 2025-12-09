<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Employee;
use App\Models\Admin;
use App\Models\BorrowRecord;
use App\Models\BorrowTransaction;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats()
    {
        try {
            $totalStudents = Student::notArchived()->count();
            $totalEmployees = Employee::notArchived()->count();

            // For now, using mock data for inventory items and pending requests
            // These can be updated when inventory and borrowing models are created
            $totalItems = 320; // This would come from Inventory model
            $pendingRequests = 12; // This would come from BorrowRequest model with pending status

            return response()->json([
                'totalStudents' => $totalStudents,
                'totalEmployees' => $totalEmployees,
                'totalItems' => $totalItems,
                'pendingRequests' => $pendingRequests,
                'recentRegistrations' => [
                    'students' => Student::notArchived()->latest()->take(5)->get(['first_name', 'last_name', 'created_at']),
                    'employees' => Employee::notArchived()->latest()->take(5)->get(['first_name', 'last_name', 'created_at'])
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch dashboard statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getRecentActivity()
    {
        try {
            $activities = [];

            // Get recent student registrations
            $recentStudents = Student::notArchived()->latest()->take(3)->get();
            foreach ($recentStudents as $student) {
                $activities[] = [
                    'type' => 'student_registration',
                    'message' => "New student registered: {$student->first_name} {$student->last_name}",
                    'timestamp' => $student->created_at,
                    'icon' => 'user'
                ];
            }

            // Get recent employee registrations
            $recentEmployees = Employee::notArchived()->latest()->take(3)->get();
            foreach ($recentEmployees as $employee) {
                $activities[] = [
                    'type' => 'employee_registration',
                    'message' => "New employee registered: {$employee->first_name} {$employee->last_name}",
                    'timestamp' => $employee->created_at,
                    'icon' => 'users'
                ];
            }

            // Sort activities by timestamp
            usort($activities, function($a, $b) {
                return $b['timestamp'] <=> $a['timestamp'];
            });

            return response()->json([
                'activities' => array_slice($activities, 0, 10) // Return latest 10 activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch recent activity',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getStudentsCount()
    {
        try {
            // Add debugging
            \Log::info('Students count endpoint called');

            $count = Student::notArchived()->count();
            \Log::info('Students count: ' . $count);

            $response = response()->json([
                'count' => $count,
                'total' => $count,
                'debug' => 'Students count fetched successfully'
            ]);

            // Add CORS headers manually
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Students count error: ' . $e->getMessage());

            $response = response()->json([
                'error' => 'Failed to fetch students count',
                'message' => $e->getMessage(),
                'count' => 0
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getEmployeesCount()
    {
        try {
            // Add debugging
            \Log::info('Employees count endpoint called');

            $count = Employee::notArchived()->count();
            \Log::info('Employees count: ' . $count);

            $response = response()->json([
                'count' => $count,
                'total' => $count,
                'debug' => 'Employees count fetched successfully'
            ]);

            // Add CORS headers manually
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('Employees count error: ' . $e->getMessage());

            $response = response()->json([
                'error' => 'Failed to fetch employees count',
                'message' => $e->getMessage(),
                'count' => 0
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getCategoryStats()
    {
        try {
            // Cache for 10 minutes (600 seconds) - category stats change less frequently
            $cacheKey = 'dashboard:category_stats';
            $cacheDuration = 600; // 10 minutes

            $categoryData = Cache::remember($cacheKey, $cacheDuration, function () {
                // Get category statistics from inventory_items
                $categoryStats = InventoryItem::select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_quantity) as total_quantity'))
                    ->whereNotNull('category')
                    ->where('category', '!=', '')
                    ->groupBy('category')
                    ->orderBy('count', 'desc')
                    ->get();

                // Calculate total items for percentage calculation
                $totalItems = InventoryItem::whereNotNull('category')
                    ->where('category', '!=', '')
                    ->count();

                // Calculate total quantity
                $totalQuantity = InventoryItem::whereNotNull('category')
                    ->where('category', '!=', '')
                    ->sum('total_quantity');

                return [
                    'categoryStats' => $categoryStats,
                    'totalItems' => $totalItems,
                    'totalQuantity' => $totalQuantity
                ];
            });

            $categoryStats = $categoryData['categoryStats'];
            $totalItems = $categoryData['totalItems'];
            $totalQuantity = $categoryData['totalQuantity'];

            // Map categories with colors and calculate percentages
            $colorMap = [
                'Electronics' => 'blue',
                'Laboratory Equipment' => 'green',
                'Office Supplies' => 'purple',
                'Furniture' => 'orange',
                'Carpentry / Masonry' => 'orange',
                'Fabrication / Welding' => 'red',
                'Aircon' => 'cyan',
                'Supplies' => 'purple',
            ];

            $categories = $categoryStats->map(function ($stat) use ($totalItems, $colorMap) {
                $categoryName = $stat->category;
                $count = (int) $stat->count;
                $percentage = $totalItems > 0 ? round(($count / $totalItems) * 100, 1) : 0;

                // Determine color based on category name
                $color = 'gray'; // default
                foreach ($colorMap as $key => $value) {
                    if (stripos($categoryName, $key) !== false) {
                        $color = $value;
                        break;
                    }
                }

                return [
                    'category' => $categoryName,
                    'count' => $count,
                    'total_quantity' => (int) $stat->total_quantity,
                    'percentage' => $percentage,
                    'color' => $color
                ];
            })->toArray();

            return response()->json([
                'success' => true,
                'categories' => $categories,
                'total_items' => $totalItems,
                'total_quantity' => (int) $totalQuantity
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching category stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch category statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMostBorrowedItems(Request $request)
    {
        try {
            // Get date range (default: last 30 days)
            $days = $request->input('days', 30);
            $limit = $request->input('limit', 10);
            $startDate = now()->subDays($days)->startOfDay();

            // Get most borrowed items from borrow_transactions
            // Count borrow transactions per inventory item
            $mostBorrowed = \App\Models\BorrowTransaction::select(
                    'inventory_item_id',
                    DB::raw('COUNT(*) as borrow_count'),
                    DB::raw('SUM(quantity) as total_quantity_borrowed')
                )
                ->whereNotNull('inventory_item_id')
                ->where('created_at', '>=', $startDate)
                ->whereIn('status', ['borrowed', 'returned', 'overdue']) // Only count actual borrows
                ->groupBy('inventory_item_id')
                ->orderBy('borrow_count', 'desc')
                ->limit($limit)
                ->get();

            // Get all inventory item IDs to eager load them (avoid N+1 queries)
            $inventoryItemIds = $mostBorrowed->pluck('inventory_item_id')->unique()->filter()->toArray();

            // Eager load all inventory items in one query
            $inventoryItems = InventoryItem::whereIn('id', $inventoryItemIds)->get()->keyBy('id');

            // Get item details and format response
            $items = [];
            $maxCount = 0;

            foreach ($mostBorrowed as $item) {
                // Get from pre-loaded collection instead of querying database
                $inventoryItem = $inventoryItems->get($item->inventory_item_id);
                if ($inventoryItem) {
                    $borrowCount = (int) $item->borrow_count;
                    if ($borrowCount > $maxCount) {
                        $maxCount = $borrowCount;
                    }

                    // Determine icon based on item name or category
                    $icon = $this->getItemIcon($inventoryItem->name, $inventoryItem->category);

                    // Determine color based on position
                    $colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
                    $colorIndex = count($items) % count($colors);

                    $items[] = [
                        'id' => $inventoryItem->id,
                        'name' => $inventoryItem->name,
                        'count' => $borrowCount,
                        'total_quantity_borrowed' => (int) $item->total_quantity_borrowed,
                        'icon' => $icon,
                        'color' => $colors[$colorIndex],
                        'category' => $inventoryItem->category
                    ];
                }
            }

            // Calculate percentages based on max count
            $items = array_map(function ($item) use ($maxCount) {
                $item['percentage'] = $maxCount > 0 ? round(($item['count'] / $maxCount) * 100, 1) : 0;
                return $item;
            }, $items);

            // Get top item for summary
            $topItem = count($items) > 0 ? $items[0] : null;

            return response()->json([
                'success' => true,
                'items' => $items,
                'top_item' => $topItem,
                'total_borrows' => array_sum(array_column($items, 'count')),
                'period_days' => $days
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching most borrowed items', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch most borrowed items',
                'error' => $e->getMessage(),
                'items' => []
            ], 500);
        }
    }

    /**
     * Get icon for item based on name or category
     */
    private function getItemIcon($itemName, $category = null)
    {
        $name = strtolower($itemName);
        $cat = strtolower($category ?? '');

        // Check item name first
        if (stripos($name, 'laptop') !== false || stripos($name, 'computer') !== false) return '💻';
        if (stripos($name, 'projector') !== false) return '📽️';
        if (stripos($name, 'camera') !== false) return '📷';
        if (stripos($name, 'tablet') !== false || stripos($name, 'ipad') !== false) return '📱';
        if (stripos($name, 'headphone') !== false || stripos($name, 'headset') !== false) return '🎧';
        if (stripos($name, 'printer') !== false) return '🖨️';
        if (stripos($name, 'scanner') !== false) return '📄';
        if (stripos($name, 'monitor') !== false || stripos($name, 'screen') !== false) return '🖥️';
        if (stripos($name, 'keyboard') !== false || stripos($name, 'mouse') !== false) return '⌨️';
        if (stripos($name, 'chair') !== false || stripos($name, 'table') !== false) return '🪑';
        if (stripos($name, 'tool') !== false) return '🔧';
        if (stripos($name, 'book') !== false) return '📚';

        // Check category
        if (stripos($cat, 'electronic') !== false) return '💻';
        if (stripos($cat, 'furniture') !== false) return '🪑';
        if (stripos($cat, 'supply') !== false) return '📦';

        // Default icon
        return '📦';
    }

    public function getBorrowingTrends(Request $request)
    {
        try {
            $period = $request->input('period', 'monthly'); // monthly, quarterly, annually
            $currentYear = now()->year;
            $currentMonth = now()->month;
            $currentDate = now();

            $data = [];

            if ($period === 'monthly') {
                // Get data for all 12 months of current year
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                for ($month = 1; $month <= 12; $month++) {
                    $startDate = Carbon::create($currentYear, $month, 1)->startOfMonth();
                    $endDate = Carbon::create($currentYear, $month, 1)->endOfMonth();

                    // If month is in the future, set all values to 0
                    if ($startDate->isFuture()) {
                        $data[] = [
                            'period' => $months[$month - 1],
                            'borrowed' => 0,
                            'returned' => 0,
                            'pending' => 0
                        ];
                        continue;
                    }

                    // Count ALL borrowed transactions created in this period (regardless of current status)
                    // This counts all transactions that were borrowed in this month, even if later returned
                    $borrowed = BorrowTransaction::whereBetween('created_at', [$startDate, $endDate])
                        ->whereIn('status', ['pending', 'borrowed', 'overdue', 'returned', 'pending_return_verification', 'rejected'])
                        ->count();

                    // Count ALL returned transactions that were returned in this period
                    // Check actual_return_date OR when status was updated to 'returned' in this period
                    $returned = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    // Transactions with actual_return_date in this period
                                    $q->whereNotNull('actual_return_date')
                                      ->whereBetween('actual_return_date', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    // Transactions where status was updated to 'returned' in this period
                                    $q->where('status', 'returned')
                                      ->whereBetween('updated_at', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    // Count pending returns: items pending return verification OR items expected to return in this period
                    $pending = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    // Items with status pending_return_verification created/updated in this period
                                    $q->where('status', 'pending_return_verification')
                                      ->whereBetween('created_at', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    // Items that are borrowed and expected to return in this period
                                    $q->whereIn('status', ['borrowed', 'overdue'])
                                      ->whereBetween('expected_return_date', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    $data[] = [
                        'period' => $months[$month - 1],
                        'borrowed' => (int) $borrowed,
                        'returned' => (int) $returned,
                        'pending' => (int) $pending
                    ];
                }
            } elseif ($period === 'quarterly') {
                // Get data for all 4 quarters of current year
                $quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

                for ($quarter = 1; $quarter <= 4; $quarter++) {
                    $startMonth = ($quarter - 1) * 3 + 1;
                    $endMonth = $quarter * 3;

                    $startDate = Carbon::create($currentYear, $startMonth, 1)->startOfMonth();
                    $endDate = Carbon::create($currentYear, $endMonth, 1)->endOfMonth();

                    // If quarter is in the future, set all values to 0
                    if ($startDate->isFuture()) {
                        $data[] = [
                            'period' => $quarters[$quarter - 1] . ' ' . $currentYear,
                            'borrowed' => 0,
                            'returned' => 0,
                            'pending' => 0
                        ];
                        continue;
                    }

                    // Count ALL borrowed transactions created in this period (regardless of current status)
                    $borrowed = BorrowTransaction::whereBetween('created_at', [$startDate, $endDate])
                        ->whereIn('status', ['pending', 'borrowed', 'overdue', 'returned', 'pending_return_verification', 'rejected'])
                        ->count();

                    // Count ALL returned transactions that were returned in this period
                    $returned = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    $q->whereNotNull('actual_return_date')
                                      ->whereBetween('actual_return_date', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    $q->where('status', 'returned')
                                      ->whereBetween('updated_at', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    // Count pending returns: items pending return verification OR items expected to return in this period
                    $pending = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    $q->where('status', 'pending_return_verification')
                                      ->whereBetween('created_at', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    $q->whereIn('status', ['borrowed', 'overdue'])
                                      ->whereBetween('expected_return_date', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    $data[] = [
                        'period' => $quarters[$quarter - 1] . ' ' . $currentYear,
                        'borrowed' => (int) $borrowed,
                        'returned' => (int) $returned,
                        'pending' => (int) $pending
                    ];
                }
            } elseif ($period === 'annually') {
                // Get data for last 5 years including current year
                $years = [];
                for ($i = 4; $i >= 0; $i--) {
                    $year = $currentYear - $i;
                    $years[] = $year;
                }

                foreach ($years as $year) {
                    $startDate = Carbon::create($year, 1, 1)->startOfYear();
                    $endDate = Carbon::create($year, 12, 31)->endOfYear();

                    // If year is in the future, set all values to 0
                    if ($startDate->isFuture()) {
                        $data[] = [
                            'period' => (string) $year,
                            'borrowed' => 0,
                            'returned' => 0,
                            'pending' => 0
                        ];
                        continue;
                    }

                    // Count ALL borrowed transactions created in this period (regardless of current status)
                    $borrowed = BorrowTransaction::whereBetween('created_at', [$startDate, $endDate])
                        ->whereIn('status', ['pending', 'borrowed', 'overdue', 'returned', 'pending_return_verification', 'rejected'])
                        ->count();

                    // Count ALL returned transactions that were returned in this period
                    $returned = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    $q->whereNotNull('actual_return_date')
                                      ->whereBetween('actual_return_date', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    $q->where('status', 'returned')
                                      ->whereBetween('updated_at', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    // Count pending returns: items pending return verification OR items expected to return in this period
                    $pending = BorrowTransaction::where(function($query) use ($startDate, $endDate) {
                            $query->where(function($q) use ($startDate, $endDate) {
                                    $q->where('status', 'pending_return_verification')
                                      ->whereBetween('created_at', [$startDate, $endDate]);
                                })
                                ->orWhere(function($q) use ($startDate, $endDate) {
                                    $q->whereIn('status', ['borrowed', 'overdue'])
                                      ->whereBetween('expected_return_date', [$startDate, $endDate]);
                                });
                        })
                        ->count();

                    $data[] = [
                        'period' => (string) $year,
                        'borrowed' => (int) $borrowed,
                        'returned' => (int) $returned,
                        'pending' => (int) $pending
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'period' => $period,
                'current_year' => $currentYear,
                'current_month' => $currentMonth
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching borrowing trends', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch borrowing trends',
                'error' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    public function getInventoryStats()
    {
        try {
            // Cache for 5 minutes (300 seconds) - inventory stats don't need to be real-time
            // Cache key includes a version to allow manual invalidation if needed
            $cacheKey = 'dashboard:inventory_stats';
            $cacheDuration = 300; // 5 minutes

            $stats = Cache::remember($cacheKey, $cacheDuration, function () {
                // Get real count of currently borrowed items from borrow_records table
                $borrowedItemsCount = BorrowRecord::whereIn('status', ['borrowed', 'overdue'])->count();

                // Get total inventory items
                $totalItems = InventoryItem::count();

                // Get low stock items (status = 'low stock' or 'out of stock')
                $lowStockItems = InventoryItem::whereIn('status', ['low stock', 'out of stock'])->count();

                // Calculate available items (items with available_quantity > 0)
                $availableItems = InventoryItem::where('available_quantity', '>', 0)->count();

                return [
                    'total_items' => $totalItems,
                    'borrowed_items' => $borrowedItemsCount,
                    'low_stock_items' => $lowStockItems,
                    'available_items' => $availableItems
                ];
            });

            \Log::info('Inventory stats fetched', $stats);

            return response()->json($stats);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch inventory stats: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch inventory stats',
                'message' => $e->getMessage(),
                'total_items' => 0,
                'borrowed_items' => 0,
                'low_stock_items' => 0,
                'available_items' => 0
            ], 500);
        }
    }

    public function authenticateSuperAdmin(Request $request)
    {
        try {
            // Add more detailed logging
            \Log::info('=== SuperAdmin Authentication Debug ===');
            \Log::info('Request data: ', $request->all());

            $credentials = $request->validate([
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            \Log::info('SuperAdmin authentication attempt', ['username' => $credentials['username']]);
            \Log::info('Looking for username in superadmin table...');

            // Check if superadmin table exists first
            if (!Schema::hasTable('superadmin')) {
                \Log::error('SuperAdmin table does not exist!');
                return response()->json([
                    'success' => false,
                    'message' => 'System configuration error: SuperAdmin table not found'
                ], 500);
            }

            // Direct database query for superadmin authentication
            $superAdmin = DB::table('superadmin')->where('username', $credentials['username'])->first();
            \Log::info('Database query result: ', $superAdmin ? ['found' => true, 'username' => $superAdmin->username] : ['found' => false]);

            if (!$superAdmin) {
                \Log::warning('SuperAdmin not found', ['username' => $credentials['username']]);

                // Check if there are any superadmin records at all
                $adminCount = DB::table('superadmin')->count();
                \Log::info('Total superadmin records in database: ' . $adminCount);

                $response = response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);

                // Add CORS headers
                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            // Check password
            \Log::info('Checking password for user: ' . $superAdmin->username);
            \Log::info('Password hash from DB: ' . substr($superAdmin->password, 0, 20) . '...');
            \Log::info('Input password: ' . $credentials['password']);

            if (!Hash::check($credentials['password'], $superAdmin->password)) {
                \Log::warning('SuperAdmin password mismatch', [
                    'username' => $credentials['username'],
                    'provided_password' => $credentials['password'],
                    'hash_from_db' => substr($superAdmin->password, 0, 20) . '...'
                ]);

                $response = response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);

                // Add CORS headers
                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

                return $response;
            }

            \Log::info('SuperAdmin authentication successful', ['username' => $credentials['username']]);

            // Authentication successful
            $response = response()->json([
                'success' => true,
                'message' => 'Authentication successful',
                'admin' => [
                    'id' => $superAdmin->id,
                    'username' => $superAdmin->username,
                    'full_name' => $superAdmin->full_name,
                    'email' => $superAdmin->email
                ]
            ]);

            // Add CORS headers
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;

        } catch (\Exception $e) {
            \Log::error('SuperAdmin authentication error', ['error' => $e->getMessage()]);

            $response = response()->json([
                'success' => false,
                'message' => 'Authentication failed',
                'error' => $e->getMessage()
            ], 500);

            // Add CORS headers to error response too
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            return $response;
        }
    }

    public function getAllStudents()
    {
        try {
            $students = Student::notArchived()->select([
                'id',
                'first_name',
                'last_name',
                'student_id',
                'email',
                'course',
                'year_level',
                'contact',
                'created_at'
            ])->get()->map(function ($student) {
                return [
                    'id' => 'STU-' . str_pad($student->id, 3, '0', STR_PAD_LEFT),
                    'firstName' => $student->first_name,
                    'lastName' => $student->last_name,
                    'studentId' => $student->student_id,
                    'email' => $student->email,
                    'course' => $student->course,
                    'yearLevel' => $student->year_level,
                    'contact' => $student->contact,
                    'status' => 'Active', // You can add this field to the database if needed
                    'registeredDate' => $student->created_at->toISOString()
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAllEmployees()
    {
        try {
            // Check if category column exists in the employees table
            $columns = Schema::getColumnListing('employees');
            $selectColumns = [
                'id',
                'first_name',
                'last_name',
                'emp_id',
                'email',
                'position',
                'department',
                'contact',
                'created_at'
            ];

            // Add category only if it exists
            if (in_array('category', $columns)) {
                $selectColumns[] = 'category';
            }

            $employees = Employee::notArchived()->select($selectColumns)->get()->map(function ($employee) use ($columns) {
                $mappedEmployee = [
                    'id' => 'EMP-' . str_pad($employee->id, 3, '0', STR_PAD_LEFT),
                    'firstName' => $employee->first_name,
                    'lastName' => $employee->last_name,
                    'employeeId' => $employee->emp_id,
                    'email' => $employee->email,
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'contact' => $employee->contact,
                    'status' => 'Active', // You can add this field to the database if needed
                    'registeredDate' => $employee->created_at->toISOString()
                ];

                // Add category only if it exists
                if (in_array('category', $columns)) {
                    $mappedEmployee['category'] = $employee->category;
                } else {
                    // Default value if category doesn't exist
                    $mappedEmployee['category'] = 'Staff';
                }

                return $mappedEmployee;
            });

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employees',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
