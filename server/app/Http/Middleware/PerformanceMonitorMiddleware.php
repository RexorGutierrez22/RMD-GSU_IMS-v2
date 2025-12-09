<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\PerformanceMonitorService;
use Symfony\Component\HttpFoundation\Response;

class PerformanceMonitorMiddleware
{
    protected $monitor;

    public function __construct(PerformanceMonitorService $monitor)
    {
        $this->monitor = $monitor;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip monitoring if disabled
        if (!config('performance.enabled', true)) {
            return $next($request);
        }

        // Skip monitoring for performance endpoint itself
        if ($request->is('api/performance*') || $request->is('api/system/performance*')) {
            return $next($request);
        }

        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        // Process the request
        $response = $next($request);

        // Calculate performance metrics
        $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
        $memoryUsage = memory_get_usage(true) - $startMemory;

        // Record performance (non-blocking)
        try {
            $this->monitor->recordRequest(
                $request->method(),
                $request->path(),
                $duration,
                $response->getStatusCode(),
                $memoryUsage
            );
        } catch (\Exception $e) {
            // Silently fail - don't break the application
            \Log::debug('Performance monitoring error: ' . $e->getMessage());
        }

        return $response;
    }
}

