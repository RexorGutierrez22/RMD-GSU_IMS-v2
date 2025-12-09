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
            $table->timestamp('overdue_notification_sent_at')->nullable()->after('approved_at')
                ->comment('Timestamp when overdue notification was last sent to borrower');
            $table->timestamp('due_soon_notification_sent_at')->nullable()->after('overdue_notification_sent_at')
                ->comment('Timestamp when due soon (1 day before) notification was sent to borrower');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            $table->dropColumn(['overdue_notification_sent_at', 'due_soon_notification_sent_at']);
        });
    }
};

