<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for the performance monitoring system.
    | You can enable/disable monitoring and configure thresholds.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Enable Performance Monitoring
    |--------------------------------------------------------------------------
    |
    | Set to true to enable performance monitoring. When disabled, the system
    | will not track any performance metrics, ensuring zero overhead.
    |
    */

    'enabled' => env('PERFORMANCE_MONITORING_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Slow Query Threshold
    |--------------------------------------------------------------------------
    |
    | Queries and requests taking longer than this threshold (in milliseconds)
    | will be logged as slow queries/requests.
    |
    */

    'slow_query_threshold' => env('PERFORMANCE_SLOW_QUERY_THRESHOLD', 1000), // milliseconds

    /*
    |--------------------------------------------------------------------------
    | Maximum Log Entries
    |--------------------------------------------------------------------------
    |
    | Maximum number of performance log entries to keep in cache.
    | Older entries will be automatically removed.
    |
    */

    'max_log_entries' => env('PERFORMANCE_MAX_LOG_ENTRIES', 1000),

    /*
    |--------------------------------------------------------------------------
    | Monitor Database Queries
    |--------------------------------------------------------------------------
    |
    | Set to true to monitor database query performance.
    | Note: This may add slight overhead to database operations.
    |
    */

    'monitor_database' => env('PERFORMANCE_MONITOR_DATABASE', true),

    /*
    |--------------------------------------------------------------------------
    | Monitor API Requests
    |--------------------------------------------------------------------------
    |
    | Set to true to monitor API request performance.
    |
    */

    'monitor_api' => env('PERFORMANCE_MONITOR_API', true),

    /*
    |--------------------------------------------------------------------------
    | Monitor Server Resources
    |--------------------------------------------------------------------------
    |
    | Set to true to monitor server resources (CPU, memory, disk).
    |
    */

    'monitor_resources' => env('PERFORMANCE_MONITOR_RESOURCES', true),

    /*
    |--------------------------------------------------------------------------
    | Cache Duration
    |--------------------------------------------------------------------------
    |
    | How long to keep performance metrics in cache (in seconds).
    |
    */

    'cache_duration' => env('PERFORMANCE_CACHE_DURATION', 3600), // 1 hour

];

