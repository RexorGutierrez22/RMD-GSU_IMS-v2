<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use App\Services\PerformanceMonitorService;
use Illuminate\Database\Events\QueryExecuted;

class PerformanceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(PerformanceMonitorService::class, function ($app) {
            return new PerformanceMonitorService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Only enable database query monitoring if configured
        if (config('performance.enabled', true) && config('performance.monitor_database', true)) {
            DB::listen(function (QueryExecuted $query) {
                try {
                    $duration = $query->time; // Already in milliseconds
                    $monitor = app(PerformanceMonitorService::class);
                    $monitor->recordQuery($query->sql, $duration, $query->bindings);
                } catch (\Exception $e) {
                    // Silently fail - don't break the application
                    \Log::debug('Database query monitoring error: ' . $e->getMessage());
                }
            });
        }
    }
}

