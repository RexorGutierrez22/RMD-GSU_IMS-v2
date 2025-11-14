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
        // Update the status enum to include 'pending' and 'rejected'
        DB::statement("ALTER TABLE borrow_transactions MODIFY COLUMN status ENUM('pending', 'borrowed', 'returned', 'overdue', 'lost', 'rejected') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE borrow_transactions MODIFY COLUMN status ENUM('borrowed', 'returned', 'overdue', 'lost') DEFAULT 'borrowed'");
    }
};
