<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BorrowTransaction;
use App\Models\Admin;
use App\Models\SuperAdmin;
use App\Mail\OverdueItemsNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CheckOverdueItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'overdue:check {--dry-run : Run without sending emails}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue items and send email notifications to admins/staff';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking for overdue items...');

        try {
            // Get all transactions that should be overdue (status is 'borrowed' and past due date)
            $shouldBeOverdue = BorrowTransaction::where('status', 'borrowed')
                ->where('expected_return_date', '<', Carbon::today())
                ->with(['user', 'inventoryItem'])
                ->get();

            // Mark items as overdue if they aren't already
            $markedCount = 0;
            foreach ($shouldBeOverdue as $transaction) {
                if ($transaction->status === 'borrowed') {
                    $transaction->markAsOverdue();
                    $markedCount++;
                }
            }

            // Get all overdue transactions (including already marked as overdue)
            $alreadyOverdue = BorrowTransaction::where('status', 'overdue')
                ->with(['user', 'inventoryItem'])
                ->get();

            // Combine all overdue items (unique by ID)
            $allOverdue = $shouldBeOverdue->merge($alreadyOverdue)->unique('id');

            if ($allOverdue->isEmpty()) {
                $this->info('✅ No overdue items found.');
                Log::info('Overdue check: No overdue items found');
                return 0;
            }

            $this->info("📋 Found {$allOverdue->count()} overdue transaction(s)");
            if ($markedCount > 0) {
                $this->info("🔄 Marked {$markedCount} transaction(s) as overdue");
            }

            // Get all active admins and super admins
            $admins = Admin::whereNotNull('email')
                ->where('email', '!=', '')
                ->get();

            $superAdmins = SuperAdmin::whereNotNull('email')
                ->where('email', '!=', '')
                ->get();

            $allStaff = $admins->merge($superAdmins)->unique('email');

            if ($allStaff->isEmpty()) {
                $this->warn('⚠️  No admin/staff emails found. Skipping email notifications.');
                Log::warning('Overdue check: No admin/staff emails found');
                return 0;
            }

            $this->info("📧 Sending notifications to {$allStaff->count()} admin/staff member(s)");

            // Prepare overdue items data
            $overdueItems = $allOverdue->map(function ($transaction) {
                return [
                    'transaction_id' => $transaction->transaction_id,
                    'borrower_name' => $transaction->borrower_name ?? ($transaction->user ? $transaction->user->full_name : 'N/A'),
                    'borrower_email' => $transaction->borrower_email ?? ($transaction->user ? $transaction->user->email : 'N/A'),
                    'borrower_contact' => $transaction->borrower_contact ?? ($transaction->user ? $transaction->user->contact_number : 'N/A'),
                    'item_name' => $transaction->inventoryItem->name ?? 'N/A',
                    'item_category' => $transaction->inventoryItem->category ?? 'N/A',
                    'quantity' => $transaction->quantity,
                    'borrow_date' => $transaction->borrow_date->format('F d, Y'),
                    'expected_return_date' => $transaction->expected_return_date->format('F d, Y'),
                    'days_overdue' => $transaction->days_overdue,
                    'purpose' => $transaction->purpose ?? 'N/A',
                ];
            })->toArray();

            $totalItems = $allOverdue->sum('quantity');
            // Calculate average days overdue (more meaningful than sum)
            $totalDaysOverdue = $allOverdue->count() > 0
                ? round($allOverdue->avg('days_overdue'), 1)
                : 0;

            // Send email to each admin/staff member
            $sentCount = 0;
            $isDryRun = $this->option('dry-run');

            foreach ($allStaff as $staff) {
                if ($isDryRun) {
                    $this->line("  [DRY RUN] Would send email to: {$staff->email}");
                } else {
                    try {
                        Mail::to($staff->email)->send(
                            new OverdueItemsNotification($overdueItems, $allOverdue->count(), $totalItems, $totalDaysOverdue)
                        );
                        $sentCount++;
                        $this->line("  ✅ Sent to: {$staff->email}");
                        Log::info("Overdue notification sent to: {$staff->email}", [
                            'overdue_count' => $allOverdue->count(),
                            'staff_email' => $staff->email
                        ]);
                    } catch (\Exception $e) {
                        $this->error("  ❌ Failed to send to {$staff->email}: {$e->getMessage()}");
                        Log::error("Failed to send overdue notification to: {$staff->email}", [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }
            }

            if ($isDryRun) {
                $this->info("🔍 [DRY RUN] Would have sent {$allStaff->count()} email(s)");
            } else {
                $this->info("✅ Successfully sent {$sentCount} notification(s)");
            }

            Log::info('Overdue check completed', [
                'overdue_count' => $allOverdue->count(),
                'emails_sent' => $sentCount,
                'total_staff' => $allStaff->count()
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error checking overdue items: {$e->getMessage()}");
            Log::error('Overdue check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}

