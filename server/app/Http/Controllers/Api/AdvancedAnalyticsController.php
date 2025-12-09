<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BorrowTransaction;
use App\Models\InventoryItem;
use App\Models\ReturnTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AdvancedAnalyticsController extends Controller
{
    /**
     * Get predictive analytics
     * Predicts future trends based on historical data
     */
    public function getPredictiveAnalytics(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30); // Look back period
            $forecastDays = $request->get('forecast_days', 7); // Days to forecast

            // Use cache to improve performance
            $cacheKey = "predictive_analytics_{$days}_{$forecastDays}";
            $analytics = Cache::remember($cacheKey, 3600, function () use ($days, $forecastDays) {
                return $this->calculatePredictiveAnalytics($days, $forecastDays);
            });

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'message' => 'Predictive analytics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve predictive analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get trend analysis
     * Analyzes patterns and trends over time
     */
    public function getTrendAnalysis(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'monthly'); // daily, weekly, monthly, yearly
            $startDate = $request->get('start_date', Carbon::now()->subMonths(6)->toDateString());
            $endDate = $request->get('end_date', Carbon::now()->toDateString());

            \Log::info('🔍 getTrendAnalysis called', [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]);

            $cacheKey = "trend_analysis_{$period}_{$startDate}_{$endDate}";
            $trends = Cache::remember($cacheKey, 1800, function () use ($period, $startDate, $endDate) {
                $result = $this->calculateTrendAnalysis($period, $startDate, $endDate);
                \Log::info('📊 Trend analysis calculated', [
                    'borrowing_trends_count' => count($result['borrowing_trends'] ?? []),
                    'return_trends_count' => count($result['return_trends'] ?? []),
                    'category_trends_count' => count($result['category_trends'] ?? []),
                    'borrowing_direction' => $result['borrowing_direction'] ?? 'unknown'
                ]);
                return $result;
            });

            return response()->json([
                'success' => true,
                'data' => $trends,
                'message' => 'Trend analysis retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ Error in getTrendAnalysis', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve trend analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get forecasting data
     * Predicts future values based on historical patterns
     */
    public function getForecasting(Request $request): JsonResponse
    {
        try {
            $forecastType = $request->get('type', 'inventory'); // inventory, borrowing, demand
            $days = $request->get('days', 30); // Forecast period

            $cacheKey = "forecasting_{$forecastType}_{$days}";
            $forecast = Cache::remember($cacheKey, 3600, function () use ($forecastType, $days) {
                return $this->calculateForecasting($forecastType, $days);
            });

            return response()->json([
                'success' => true,
                'data' => $forecast,
                'message' => 'Forecasting data retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve forecasting data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate predictive analytics
     */
    private function calculatePredictiveAnalytics(int $days, int $forecastDays): array
    {
        $startDate = Carbon::now()->subDays($days);

        // Predict most borrowed items
        $borrowingHistory = BorrowTransaction::where('created_at', '>=', $startDate)
            ->select('inventory_item_id', DB::raw('COUNT(*) as borrow_count'))
            ->groupBy('inventory_item_id')
            ->orderBy('borrow_count', 'desc')
            ->limit(10)
            ->get();

        $predictedMostBorrowed = [];
        foreach ($borrowingHistory as $item) {
            $inventoryItem = InventoryItem::find($item->inventory_item_id);
            if ($inventoryItem) {
                // Simple linear prediction: if trend continues
                $dailyAverage = $item->borrow_count / $days;
                $predictedBorrows = round($dailyAverage * $forecastDays);

                $predictedMostBorrowed[] = [
                    'item_id' => $inventoryItem->id,
                    'item_name' => $inventoryItem->name,
                    'current_borrow_count' => (int) $item->borrow_count,
                    'predicted_borrow_count' => $predictedBorrows,
                    'daily_average' => round($dailyAverage, 2),
                    'confidence' => $this->calculateConfidence($days, $item->borrow_count)
                ];
            }
        }

        // Predict inventory depletion
        $depletionPredictions = [];
        $items = InventoryItem::where('available_quantity', '>', 0)->get();

        foreach ($items as $item) {
            // Calculate average daily usage
            $borrowsForItem = BorrowTransaction::where('inventory_item_id', $item->id)
                ->where('created_at', '>=', $startDate)
                ->sum('quantity');

            $returnsForItem = ReturnTransaction::whereHas('borrowTransaction', function($q) use ($item) {
                $q->where('inventory_item_id', $item->id);
            })->where('return_date', '>=', $startDate->toDateString())
              ->sum(DB::raw('(SELECT quantity FROM borrow_transactions WHERE id = return_transactions.borrow_transaction_id)'));

            $netUsage = $borrowsForItem - $returnsForItem;
            $dailyUsage = $netUsage > 0 ? $netUsage / $days : 0;

            if ($dailyUsage > 0) {
                $daysUntilDepletion = round($item->available_quantity / $dailyUsage);

                if ($daysUntilDepletion <= $forecastDays * 2) {
                    $depletionPredictions[] = [
                        'item_id' => $item->id,
                        'item_name' => $item->name,
                        'current_quantity' => $item->available_quantity,
                        'daily_usage_rate' => round($dailyUsage, 2),
                        'predicted_depletion_days' => $daysUntilDepletion,
                        'depletion_date' => Carbon::now()->addDays($daysUntilDepletion)->toDateString(),
                        'risk_level' => $daysUntilDepletion <= $forecastDays ? 'high' : ($daysUntilDepletion <= $forecastDays * 2 ? 'medium' : 'low')
                    ];
                }
            }
        }

        // Sort by risk level
        usort($depletionPredictions, function($a, $b) {
            $riskOrder = ['high' => 3, 'medium' => 2, 'low' => 1];
            return $riskOrder[$b['risk_level']] - $riskOrder[$a['risk_level']];
        });

        return [
            'predicted_most_borrowed' => $predictedMostBorrowed,
            'inventory_depletion_predictions' => array_slice($depletionPredictions, 0, 10),
            'analysis_period_days' => $days,
            'forecast_period_days' => $forecastDays,
            'generated_at' => Carbon::now()->toISOString()
        ];
    }

    /**
     * Calculate trend analysis
     */
    private function calculateTrendAnalysis(string $period, string $startDate, string $endDate): array
    {
        try {
            $start = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);

            // Ensure we have a valid date range
            if ($start->greaterThan($end)) {
                // Swap if start is after end
                $temp = $start;
                $start = $end;
                $end = $temp;
            }

            // Borrowing trends
            $borrowingTrends = [];
            $returnTrends = [];

            $current = $start->copy();

            while ($current <= $end) {
                $periodStart = $current->copy();
                $periodEnd = $current->copy();

                switch ($period) {
                    case 'daily':
                        $periodEnd->endOfDay();
                        break;
                    case 'weekly':
                        $periodEnd->endOfWeek();
                        break;
                    case 'monthly':
                        $periodEnd->endOfMonth();
                        break;
                    case 'yearly':
                        $periodEnd->endOfYear();
                        break;
                }

                if ($periodEnd > $end) {
                    $periodEnd = $end->copy();
                }

                // Count borrows in this period - use whereDate for date-only comparison
                $borrowCount = BorrowTransaction::whereBetween('created_at', [$periodStart, $periodEnd])
                    ->count();

                // Count returns in this period - use whereDate for date comparison
                $returnCount = ReturnTransaction::whereDate('return_date', '>=', $periodStart->toDateString())
                    ->whereDate('return_date', '<=', $periodEnd->toDateString())
                    ->count();

            $periodLabel = match($period) {
                'daily' => $periodStart->format('M d'),
                'weekly' => 'Week ' . $periodStart->format('W, Y'),
                'monthly' => $periodStart->format('M Y'),
                'yearly' => $periodStart->format('Y'),
                default => $periodStart->format('Y-m-d')
            };

            $borrowingTrends[] = [
                'period' => $periodLabel,
                'date' => $periodStart->toDateString(),
                'count' => $borrowCount
            ];

            $returnTrends[] = [
                'period' => $periodLabel,
                'date' => $periodStart->toDateString(),
                'count' => $returnCount
            ];

            // Move to next period
            switch ($period) {
                case 'daily':
                    $current->addDay();
                    break;
                case 'weekly':
                    $current->addWeek();
                    break;
                case 'monthly':
                    $current->addMonth();
                    break;
                case 'yearly':
                    $current->addYear();
                    break;
            }
        }

            // Calculate trend direction (increasing, decreasing, stable)
            $borrowingTrend = $this->calculateTrendDirection($borrowingTrends);
            $returnTrend = $this->calculateTrendDirection($returnTrends);

            // Category trends
            $categoryTrends = BorrowTransaction::whereBetween('created_at', [$start, $end])
                ->join('inventory_items', 'borrow_transactions.inventory_item_id', '=', 'inventory_items.id')
                ->select('inventory_items.category', DB::raw('COUNT(*) as count'))
                ->groupBy('inventory_items.category')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'category' => $item->category,
                        'borrow_count' => (int) $item->count
                    ];
                });

            return [
                'borrowing_trends' => $borrowingTrends,
                'return_trends' => $returnTrends,
                'borrowing_direction' => $borrowingTrend,
                'return_direction' => $returnTrend,
                'category_trends' => $categoryTrends,
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'generated_at' => Carbon::now()->toISOString()
            ];
        } catch (\Exception $e) {
            // Log error and return empty structure
            \Log::error('Error calculating trend analysis', [
                'error' => $e->getMessage(),
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'borrowing_trends' => [],
                'return_trends' => [],
                'borrowing_direction' => 'insufficient_data',
                'return_direction' => 'insufficient_data',
                'category_trends' => [],
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'generated_at' => Carbon::now()->toISOString(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Calculate forecasting
     */
    private function calculateForecasting(string $type, int $days): array
    {
        $historicalDays = $days * 2; // Use 2x historical data for better accuracy
        $startDate = Carbon::now()->subDays($historicalDays);

        switch ($type) {
            case 'inventory':
                return $this->forecastInventory($startDate, $days);

            case 'borrowing':
                return $this->forecastBorrowing($startDate, $days);

            case 'demand':
                return $this->forecastDemand($startDate, $days);

            default:
                return $this->forecastInventory($startDate, $days);
        }
    }

    /**
     * Forecast inventory needs
     */
    private function forecastInventory(Carbon $startDate, int $forecastDays): array
    {
        $items = InventoryItem::all();
        $forecasts = [];

        foreach ($items as $item) {
            // Calculate historical usage
            $totalBorrowed = BorrowTransaction::where('inventory_item_id', $item->id)
                ->where('created_at', '>=', $startDate)
                ->sum('quantity');

            $totalReturned = ReturnTransaction::whereHas('borrowTransaction', function($q) use ($item) {
                $q->where('inventory_item_id', $item->id);
            })->where('return_date', '>=', $startDate->toDateString())
              ->count(); // Approximate returns

            $historicalDays = $startDate->diffInDays(Carbon::now());
            $dailyUsage = $historicalDays > 0 ? $totalBorrowed / $historicalDays : 0;

            $predictedUsage = round($dailyUsage * $forecastDays);
            $currentStock = $item->available_quantity;
            $recommendedStock = max($predictedUsage * 1.5, $currentStock); // 1.5x safety buffer

            $forecasts[] = [
                'item_id' => $item->id,
                'item_name' => $item->name,
                'current_stock' => $currentStock,
                'predicted_usage' => $predictedUsage,
                'recommended_stock' => (int) $recommendedStock,
                'reorder_needed' => $currentStock < $predictedUsage,
                'days_until_reorder' => $dailyUsage > 0 ? round($currentStock / $dailyUsage) : null
            ];
        }

        return [
            'forecast_type' => 'inventory',
            'forecast_period_days' => $forecastDays,
            'forecasts' => $forecasts,
            'generated_at' => Carbon::now()->toISOString()
        ];
    }

    /**
     * Forecast borrowing patterns
     */
    private function forecastBorrowing(Carbon $startDate, int $forecastDays): array
    {
        $historicalDays = $startDate->diffInDays(Carbon::now());

        // Daily borrowing averages
        $dailyAverages = [];
        for ($i = 0; $i < 7; $i++) { // Day of week pattern
            $dayOfWeek = Carbon::now()->startOfWeek()->addDays($i);
            $count = BorrowTransaction::whereBetween('created_at', [
                $startDate->copy()->startOfWeek()->addDays($i),
                Carbon::now()->copy()->startOfWeek()->addDays($i)
            ])->whereRaw('DAYOFWEEK(created_at) = ?', [$i + 1])
              ->count();

            $dailyAverages[$dayOfWeek->format('l')] = round($count / ($historicalDays / 7), 2);
        }

        // Project future borrows
        $projectedBorrows = [];
        for ($day = 0; $day < $forecastDays; $day++) {
            $date = Carbon::now()->addDays($day);
            $dayName = $date->format('l');
            $averageForDay = $dailyAverages[$dayName] ?? 0;

            $projectedBorrows[] = [
                'date' => $date->toDateString(),
                'day' => $dayName,
                'projected_count' => (int) round($averageForDay),
                'range' => [
                    'min' => (int) round($averageForDay * 0.7),
                    'max' => (int) round($averageForDay * 1.3)
                ]
            ];
        }

        $totalProjected = array_sum(array_column($projectedBorrows, 'projected_count'));

        return [
            'forecast_type' => 'borrowing',
            'forecast_period_days' => $forecastDays,
            'daily_patterns' => $dailyAverages,
            'projected_borrows' => $projectedBorrows,
            'total_projected' => $totalProjected,
            'generated_at' => Carbon::now()->toISOString()
        ];
    }

    /**
     * Forecast demand
     */
    private function forecastDemand(Carbon $startDate, int $forecastDays): array
    {
        // Top items by demand
        $topItems = BorrowTransaction::where('created_at', '>=', $startDate)
            ->select('inventory_item_id', DB::raw('SUM(quantity) as total_demand'))
            ->groupBy('inventory_item_id')
            ->orderBy('total_demand', 'desc')
            ->limit(10)
            ->get();

        $historicalDays = $startDate->diffInDays(Carbon::now());

        $demandForecasts = [];
        foreach ($topItems as $itemData) {
            $item = InventoryItem::find($itemData->inventory_item_id);
            if ($item) {
                $dailyDemand = $historicalDays > 0 ? $itemData->total_demand / $historicalDays : 0;
                $predictedDemand = round($dailyDemand * $forecastDays);

                $demandForecasts[] = [
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'category' => $item->category,
                    'historical_total_demand' => (int) $itemData->total_demand,
                    'daily_average_demand' => round($dailyDemand, 2),
                    'predicted_demand' => $predictedDemand,
                    'current_stock' => $item->available_quantity,
                    'stock_status' => $item->available_quantity >= $predictedDemand ? 'sufficient' : 'insufficient'
                ];
            }
        }

        return [
            'forecast_type' => 'demand',
            'forecast_period_days' => $forecastDays,
            'top_demand_items' => $demandForecasts,
            'generated_at' => Carbon::now()->toISOString()
        ];
    }

    /**
     * Calculate trend direction
     */
    private function calculateTrendDirection(array $trends): string
    {
        if (count($trends) < 2) {
            return 'insufficient_data';
        }

        $firstHalf = array_slice($trends, 0, ceil(count($trends) / 2));
        $secondHalf = array_slice($trends, ceil(count($trends) / 2));

        $firstAvg = array_sum(array_column($firstHalf, 'count')) / count($firstHalf);
        $secondAvg = array_sum(array_column($secondHalf, 'count')) / count($secondHalf);

        $change = (($secondAvg - $firstAvg) / max($firstAvg, 1)) * 100;

        if ($change > 10) {
            return 'increasing';
        } elseif ($change < -10) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    /**
     * Calculate confidence score (0-100)
     */
    private function calculateConfidence(int $days, int $sampleSize): int
    {
        // More data = higher confidence
        // Minimum 30 days and at least 5 samples for good confidence
        $confidence = min(100, ($days / 60) * 50 + min(50, ($sampleSize / 10) * 50));
        return (int) round($confidence);
    }
}

