<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            // Drop the foreign key constraint on user_id
            $table->dropForeign(['user_id']);

            // Add fields to support both users table and students/employees tables
            $table->string('borrower_type')->nullable()->after('user_id'); // 'user', 'student', 'employee'
            $table->unsignedBigInteger('borrower_id')->nullable()->after('borrower_type'); // ID from respective table
            $table->string('borrower_name')->nullable()->after('borrower_id'); // Cache the name for quick display
            $table->string('borrower_id_number')->nullable()->after('borrower_name'); // Student ID or Employee ID
            $table->string('borrower_email')->nullable()->after('borrower_id_number'); // Email address
            $table->string('borrower_contact')->nullable()->after('borrower_email'); // Contact number
        });

        // Make user_id nullable in a separate statement
        DB::statement('ALTER TABLE borrow_transactions MODIFY user_id BIGINT UNSIGNED NULL');
    }    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore user_id to NOT NULL
        DB::statement('ALTER TABLE borrow_transactions MODIFY user_id BIGINT UNSIGNED NOT NULL');

        Schema::table('borrow_transactions', function (Blueprint $table) {
            // Re-add foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Drop the new columns
            $table->dropColumn([
                'borrower_type',
                'borrower_id',
                'borrower_name',
                'borrower_id_number',
                'borrower_email',
                'borrower_contact'
            ]);
        });
    }
};
