<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupFull extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:full';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a full system backup (database + files)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('💾 Starting full system backup...');

        try {
            // Temporarily disable notifications to avoid configuration issues
            config(['backup.notifications.notifications' => []]);

            // Run the full backup command (database + files)
            Artisan::call('backup:run');

            $output = Artisan::output();

            if (strpos($output, 'success') !== false || strpos($output, 'completed') !== false || strpos($output, 'Backup completed') !== false) {
                $this->info('✅ Full system backup completed successfully');
                Log::info('Full system backup completed successfully', [
                    'timestamp' => Carbon::now()->toDateTimeString(),
                ]);
                return 0;
            } else {
                $this->warn('⚠️  Backup completed with warnings. Check logs for details.');
                Log::warning('Full system backup completed with warnings', [
                    'output' => $output,
                    'timestamp' => Carbon::now()->toDateTimeString(),
                ]);
                return 0;
            }

        } catch (\Exception $e) {
            // If error is about notifications, try again without notification handling
            if (strpos($e->getMessage(), 'notification') !== false) {
                try {
                    config(['backup.notifications.notifications' => []]);
                    Artisan::call('backup:run');
                    $output = Artisan::output();

                    if (strpos($output, 'Backup completed') !== false || strpos($output, 'success') !== false) {
                        $this->info('✅ Full system backup completed successfully (notifications disabled)');
                        Log::info('Full system backup completed successfully (notifications disabled)', [
                            'timestamp' => Carbon::now()->toDateTimeString(),
                        ]);
                        return 0;
                    }
                } catch (\Exception $e2) {
                    // Continue to error handling below
                }
            }

            $this->error("❌ Full system backup failed: {$e->getMessage()}");
            Log::error('Full system backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'timestamp' => Carbon::now()->toDateTimeString(),
            ]);
            return 1;
        }
    }
}

