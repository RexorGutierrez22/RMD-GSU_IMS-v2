<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PerformanceMonitorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class PerformanceController extends Controller
{
    protected $monitor;

    public function __construct(PerformanceMonitorService $monitor)
    {
        $this->monitor = $monitor;

        // Only allow authenticated admins/superadmins to access performance data
        $this->middleware('auth:sanctum');
    }

    /**
     * Get performance metrics
     */
    public function getMetrics(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'hour'); // hour, day, week

            // Validate period
            if (!in_array($period, ['hour', 'day', 'week'])) {
                $period = 'hour';
            }

            $metrics = $this->monitor->getMetrics($period);

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'message' => 'Performance metrics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance metrics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get slow queries
     */
    public function getSlowQueries(Request $request): JsonResponse
    {
        try {
            $date = $request->get('date', Carbon::now()->format('Y-m-d'));
            $key = 'perf:queries:' . $date;
            $queries = \Cache::get($key, []);

            return response()->json([
                'success' => true,
                'data' => [
                    'date' => $date,
                    'count' => count($queries),
                    'queries' => array_slice($queries, -50) // Last 50 slow queries
                ],
                'message' => 'Slow queries retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve slow queries',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent API requests
     */
    public function getRecentRequests(Request $request): JsonResponse
    {
        try {
            $limit = min((int) $request->get('limit', 50), 100); // Max 100
            $now = Carbon::now();
            $key = 'perf:requests:' . $now->format('Y-m-d-H');
            $requests = \Cache::get($key, []);

            // Get recent requests
            $recent = array_slice($requests, -$limit);

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => count($recent),
                    'requests' => $recent
                ],
                'message' => 'Recent requests retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recent requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear performance logs
     */
    public function clearLogs(Request $request): JsonResponse
    {
        try {
            $days = (int) $request->get('days', 7);
            $this->monitor->clearOldLogs($days);

            return response()->json([
                'success' => true,
                'message' => "Performance logs older than {$days} days cleared successfully"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear performance logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

