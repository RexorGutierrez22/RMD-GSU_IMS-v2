<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BorrowTransaction;
use App\Mail\BorrowerOverdueNotification;
use App\Mail\BorrowerDueSoonNotification;
use App\Mail\BorrowerDueTodayNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendBorrowerNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'borrowers:notify {--dry-run : Run without sending emails}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send email notifications to borrowers for overdue items, items due today, and items due tomorrow';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📧 Checking for borrowers who need notifications...');

        try {
            $isDryRun = $this->option('dry-run');
            $today = Carbon::today();
            $tomorrow = Carbon::tomorrow();

            // Get overdue items (status is 'borrowed' and past due date)
            // Only send notification if not sent today already (prevents duplicate emails on same day)
            $overdueItems = BorrowTransaction::whereIn('status', ['borrowed', 'overdue'])
                ->where('expected_return_date', '<', $today)
                ->where(function($query) use ($today) {
                    // Only send if notification wasn't sent today
                    $query->whereNull('overdue_notification_sent_at')
                          ->orWhereDate('overdue_notification_sent_at', '<', $today);
                })
                ->whereNotNull('borrower_email')
                ->where('borrower_email', '!=', '')
                ->with(['inventoryItem'])
                ->get();

            // Get items due today (status is 'borrowed' and due date is today)
            // Only send notification if not sent today already
            $dueTodayItems = BorrowTransaction::where('status', 'borrowed')
                ->whereDate('expected_return_date', $today)
                ->where(function($query) use ($today) {
                    // Only send if notification wasn't sent today
                    $query->whereNull('due_today_notification_sent_at')
                          ->orWhereDate('due_today_notification_sent_at', '<', $today);
                })
                ->whereNotNull('borrower_email')
                ->where('borrower_email', '!=', '')
                ->with(['inventoryItem'])
                ->get();

            // Get items due tomorrow (status is 'borrowed' and due date is tomorrow)
            // Only send notification if not sent already
            $dueSoonItems = BorrowTransaction::where('status', 'borrowed')
                ->whereDate('expected_return_date', $tomorrow)
                ->whereNull('due_soon_notification_sent_at')
                ->whereNotNull('borrower_email')
                ->where('borrower_email', '!=', '')
                ->with(['inventoryItem'])
                ->get();

            $overdueCount = $overdueItems->count();
            $dueTodayCount = $dueTodayItems->count();
            $dueSoonCount = $dueSoonItems->count();

            if ($overdueCount === 0 && $dueTodayCount === 0 && $dueSoonCount === 0) {
                $this->info('✅ No borrowers need notifications at this time.');
                Log::info('Borrower notifications: No items need notification');
                return 0;
            }

            $this->info("📋 Found {$overdueCount} overdue item(s), {$dueTodayCount} item(s) due today, and {$dueSoonCount} item(s) due tomorrow");

            $sentOverdue = 0;
            $sentDueToday = 0;
            $sentDueSoon = 0;
            $failed = 0;

            // Send overdue notifications
            foreach ($overdueItems as $transaction) {
                try {
                    if ($isDryRun) {
                        $this->line("  [DRY RUN] Would send overdue notification to: {$transaction->borrower_email}");
                    } else {
                        Mail::to($transaction->borrower_email)->send(
                            new BorrowerOverdueNotification($transaction)
                        );

                        // Update notification timestamp
                        $transaction->overdue_notification_sent_at = now();
                        $transaction->save();

                        $sentOverdue++;
                        $this->line("  ✅ Sent overdue notification to: {$transaction->borrower_email}");
                        Log::info("Overdue notification sent to borrower", [
                            'transaction_id' => $transaction->transaction_id,
                            'borrower_email' => $transaction->borrower_email,
                            'borrower_name' => $transaction->borrower_name
                        ]);
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("  ❌ Failed to send overdue notification to {$transaction->borrower_email}: {$e->getMessage()}");
                    Log::error("Failed to send overdue notification to borrower", [
                        'transaction_id' => $transaction->transaction_id,
                        'borrower_email' => $transaction->borrower_email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Send due today notifications
            foreach ($dueTodayItems as $transaction) {
                try {
                    if ($isDryRun) {
                        $this->line("  [DRY RUN] Would send due today notification to: {$transaction->borrower_email}");
                    } else {
                        Mail::to($transaction->borrower_email)->send(
                            new BorrowerDueTodayNotification($transaction)
                        );

                        // Update notification timestamp
                        $transaction->due_today_notification_sent_at = now();
                        $transaction->save();

                        $sentDueToday++;
                        $this->line("  ✅ Sent due today notification to: {$transaction->borrower_email}");
                        Log::info("Due today notification sent to borrower", [
                            'transaction_id' => $transaction->transaction_id,
                            'borrower_email' => $transaction->borrower_email,
                            'borrower_name' => $transaction->borrower_name
                        ]);
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("  ❌ Failed to send due today notification to {$transaction->borrower_email}: {$e->getMessage()}");
                    Log::error("Failed to send due today notification to borrower", [
                        'transaction_id' => $transaction->transaction_id,
                        'borrower_email' => $transaction->borrower_email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Send due soon notifications
            foreach ($dueSoonItems as $transaction) {
                try {
                    if ($isDryRun) {
                        $this->line("  [DRY RUN] Would send due soon notification to: {$transaction->borrower_email}");
                    } else {
                        Mail::to($transaction->borrower_email)->send(
                            new BorrowerDueSoonNotification($transaction)
                        );

                        // Update notification timestamp
                        $transaction->due_soon_notification_sent_at = now();
                        $transaction->save();

                        $sentDueSoon++;
                        $this->line("  ✅ Sent due soon notification to: {$transaction->borrower_email}");
                        Log::info("Due soon notification sent to borrower", [
                            'transaction_id' => $transaction->transaction_id,
                            'borrower_email' => $transaction->borrower_email,
                            'borrower_name' => $transaction->borrower_name
                        ]);
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("  ❌ Failed to send due soon notification to {$transaction->borrower_email}: {$e->getMessage()}");
                    Log::error("Failed to send due soon notification to borrower", [
                        'transaction_id' => $transaction->transaction_id,
                        'borrower_email' => $transaction->borrower_email,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if ($isDryRun) {
                $this->info("🔍 [DRY RUN] Would have sent {$overdueCount} overdue, {$dueTodayCount} due today, and {$dueSoonCount} due soon notification(s)");
            } else {
                $this->info("✅ Successfully sent {$sentOverdue} overdue, {$sentDueToday} due today, and {$sentDueSoon} due soon notification(s)");
                if ($failed > 0) {
                    $this->warn("⚠️  {$failed} notification(s) failed to send");
                }
            }

            Log::info('Borrower notifications completed', [
                'overdue_sent' => $sentOverdue,
                'due_today_sent' => $sentDueToday,
                'due_soon_sent' => $sentDueSoon,
                'failed' => $failed
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error sending borrower notifications: {$e->getMessage()}");
            Log::error('Borrower notifications failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}

