<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'pending_return_verification' to the status enum
        DB::statement("ALTER TABLE borrow_transactions MODIFY COLUMN status ENUM('pending', 'borrowed', 'returned', 'overdue', 'lost', 'rejected', 'pending_return_verification') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to previous enum values
        DB::statement("ALTER TABLE borrow_transactions MODIFY COLUMN status ENUM('pending', 'borrowed', 'returned', 'overdue', 'lost', 'rejected') DEFAULT 'pending'");
    }
};
