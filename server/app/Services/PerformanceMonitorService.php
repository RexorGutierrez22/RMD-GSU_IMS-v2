<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class PerformanceMonitorService
{
    protected $enabled;
    protected $slowQueryThreshold;
    protected $maxLogEntries;

    public function __construct()
    {
        $this->enabled = config('performance.enabled', true);
        $this->slowQueryThreshold = config('performance.slow_query_threshold', 1000); // milliseconds
        $this->maxLogEntries = config('performance.max_log_entries', 1000);
    }

    /**
     * Record API request performance
     */
    public function recordRequest($method, $uri, $duration, $statusCode, $memoryUsage = null)
    {
        if (!$this->enabled) {
            return;
        }

        try {
            $data = [
                'method' => $method,
                'uri' => $uri,
                'duration' => $duration,
                'status_code' => $statusCode,
                'memory_usage' => $memoryUsage ?? memory_get_usage(true),
                'timestamp' => Carbon::now()->toDateTimeString(),
            ];

            // Store in cache for quick access
            $key = 'perf:requests:' . Carbon::now()->format('Y-m-d-H-i');
            $requests = Cache::get($key, []);
            $requests[] = $data;

            // Keep only last N entries
            if (count($requests) > $this->maxLogEntries) {
                $requests = array_slice($requests, -$this->maxLogEntries);
            }

            Cache::put($key, $requests, 3600); // Store for 1 hour

            // Log slow requests
            if ($duration > $this->slowQueryThreshold) {
                Log::warning('Slow API Request Detected', $data);
            }

        } catch (\Exception $e) {
            // Silently fail - don't break the application
            Log::debug('Performance monitoring error: ' . $e->getMessage());
        }
    }

    /**
     * Record database query performance
     */
    public function recordQuery($query, $duration, $bindings = [])
    {
        if (!$this->enabled) {
            return;
        }

        try {
            // Only track slow queries
            if ($duration < $this->slowQueryThreshold) {
                return;
            }

            $data = [
                'query' => $query,
                'duration' => $duration,
                'bindings' => $bindings,
                'timestamp' => Carbon::now()->toDateTimeString(),
            ];

            $key = 'perf:queries:' . Carbon::now()->format('Y-m-d');
            $queries = Cache::get($key, []);
            $queries[] = $data;

            // Keep only last 100 slow queries per day
            if (count($queries) > 100) {
                $queries = array_slice($queries, -100);
            }

            Cache::put($key, $queries, 86400); // Store for 24 hours

            Log::warning('Slow Database Query Detected', $data);

        } catch (\Exception $e) {
            // Silently fail
            Log::debug('Query performance monitoring error: ' . $e->getMessage());
        }
    }

    /**
     * Get performance metrics
     */
    public function getMetrics($period = 'hour')
    {
        if (!$this->enabled) {
            return $this->getDefaultMetrics();
        }

        try {
            $now = Carbon::now();
            $format = $period === 'hour' ? 'Y-m-d-H' : 'Y-m-d';
            $key = 'perf:requests:' . $now->format($format);
            $requests = Cache::get($key, []);

            if (empty($requests)) {
                return $this->getDefaultMetrics();
            }

            $totalRequests = count($requests);
            $totalDuration = array_sum(array_column($requests, 'duration'));
            $avgDuration = $totalRequests > 0 ? $totalDuration / $totalRequests : 0;
            $maxDuration = max(array_column($requests, 'duration'));
            $minDuration = min(array_column($requests, 'duration'));

            $statusCodes = array_count_values(array_column($requests, 'status_code'));
            $methods = array_count_values(array_column($requests, 'method'));

            $slowRequests = array_filter($requests, function($req) {
                return $req['duration'] > $this->slowQueryThreshold;
            });

            $totalMemory = array_sum(array_column($requests, 'memory_usage'));
            $avgMemory = $totalRequests > 0 ? $totalMemory / $totalRequests : 0;

            return [
                'period' => $period,
                'total_requests' => $totalRequests,
                'average_response_time' => round($avgDuration, 2),
                'min_response_time' => round($minDuration, 2),
                'max_response_time' => round($maxDuration, 2),
                'slow_requests' => count($slowRequests),
                'status_codes' => $statusCodes,
                'methods' => $methods,
                'average_memory_usage' => round($avgMemory / 1024 / 1024, 2), // MB
                'server_resources' => $this->getServerResources(),
                'database_stats' => $this->getDatabaseStats(),
            ];

        } catch (\Exception $e) {
            Log::error('Error getting performance metrics: ' . $e->getMessage());
            return $this->getDefaultMetrics();
        }
    }

    /**
     * Get server resource usage
     */
    protected function getServerResources()
    {
        try {
            return [
                'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2), // MB
                'memory_peak' => round(memory_get_peak_usage(true) / 1024 / 1024, 2), // MB
                'memory_limit' => $this->parseMemoryLimit(ini_get('memory_limit')),
                'cpu_usage' => $this->getCpuUsage(),
                'disk_usage' => $this->getDiskUsage(),
            ];
        } catch (\Exception $e) {
            return [
                'memory_usage' => 0,
                'memory_peak' => 0,
                'memory_limit' => 0,
                'cpu_usage' => 0,
                'disk_usage' => 0,
            ];
        }
    }

    /**
     * Get database statistics
     */
    protected function getDatabaseStats()
    {
        try {
            $connection = DB::connection();
            $pdo = $connection->getPdo();

            // Get connection info
            $stats = [
                'connection_name' => $connection->getName(),
                'database_name' => $connection->getDatabaseName(),
            ];

            // Try to get query count (if available)
            if (method_exists($connection, 'getQueryLog')) {
                $queryLog = $connection->getQueryLog();
                $stats['total_queries'] = count($queryLog);
                $stats['total_query_time'] = array_sum(array_column($queryLog, 'time'));
            }

            return $stats;
        } catch (\Exception $e) {
            return [
                'connection_name' => 'unknown',
                'database_name' => 'unknown',
                'total_queries' => 0,
                'total_query_time' => 0,
            ];
        }
    }

    /**
     * Get CPU usage (platform-specific)
     */
    protected function getCpuUsage()
    {
        if (PHP_OS_FAMILY === 'Windows') {
            // Windows - use WMI or return 0
            return 0; // CPU monitoring on Windows requires additional setup
        } else {
            // Linux/Unix
            $load = sys_getloadavg();
            return $load ? round($load[0] * 100, 2) : 0;
        }
    }

    /**
     * Get disk usage
     */
    protected function getDiskUsage()
    {
        try {
            $total = disk_total_space(base_path());
            $free = disk_free_space(base_path());
            $used = $total - $free;

            return [
                'total' => round($total / 1024 / 1024 / 1024, 2), // GB
                'used' => round($used / 1024 / 1024 / 1024, 2), // GB
                'free' => round($free / 1024 / 1024 / 1024, 2), // GB
                'percentage' => $total > 0 ? round(($used / $total) * 100, 2) : 0,
            ];
        } catch (\Exception $e) {
            return [
                'total' => 0,
                'used' => 0,
                'free' => 0,
                'percentage' => 0,
            ];
        }
    }

    /**
     * Parse memory limit string to bytes
     */
    protected function parseMemoryLimit($limit)
    {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit) - 1]);
        $value = (int) $limit;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return round($value / 1024 / 1024, 2); // Return in MB
    }

    /**
     * Get default metrics when monitoring is disabled
     */
    protected function getDefaultMetrics()
    {
        return [
            'period' => 'hour',
            'total_requests' => 0,
            'average_response_time' => 0,
            'min_response_time' => 0,
            'max_response_time' => 0,
            'slow_requests' => 0,
            'status_codes' => [],
            'methods' => [],
            'average_memory_usage' => 0,
            'server_resources' => $this->getServerResources(),
            'database_stats' => $this->getDatabaseStats(),
        ];
    }

    /**
     * Clear old performance logs
     */
    public function clearOldLogs($days = 7)
    {
        if (!$this->enabled) {
            return;
        }

        try {
            $cutoff = Carbon::now()->subDays($days);
            $current = Carbon::now();

            // Clear old cache entries
            while ($current->greaterThan($cutoff)) {
                $key = 'perf:requests:' . $current->format('Y-m-d-H');
                Cache::forget($key);
                $current->subHour();
            }
        } catch (\Exception $e) {
            Log::error('Error clearing performance logs: ' . $e->getMessage());
        }
    }
}

