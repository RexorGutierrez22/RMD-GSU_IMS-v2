<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Check for overdue items daily at 9:00 AM (sends to admins/staff)
        $schedule->command('overdue:check')
            ->dailyAt('09:00')
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground();

        // Send borrower notifications daily at 10:00 AM (sends to borrowers)
        $schedule->command('borrowers:notify')
            ->dailyAt('10:00')
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground();

        // Daily database backup at 2:00 AM
        $schedule->command('backup:database')
            ->dailyAt('02:00')
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground()
            ->onOneServer();

        // Weekly full system backup (database + files) every Sunday at 3:00 AM
        $schedule->command('backup:full')
            ->weeklyOn(0, '03:00') // Sunday at 3:00 AM
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground()
            ->onOneServer();

        // Clean up old backups daily at 4:00 AM
        $schedule->command('backup:clean')
            ->dailyAt('04:00')
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground();

        // Auto-delete archived items daily at 5:00 AM (items archived for 1+ month)
        $schedule->command('archive:auto-delete')
            ->dailyAt('05:00')
            ->timezone('Asia/Manila')
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
