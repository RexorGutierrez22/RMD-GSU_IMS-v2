<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            // Add due_today_notification_sent_at field after due_soon_notification_sent_at
            if (!Schema::hasColumn('borrow_transactions', 'due_today_notification_sent_at')) {
                $table->timestamp('due_today_notification_sent_at')->nullable()->after('due_soon_notification_sent_at')
                    ->comment('Timestamp when due today notification was sent to borrower');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('borrow_transactions', 'due_today_notification_sent_at')) {
                $table->dropColumn('due_today_notification_sent_at');
            }
        });
    }
};
