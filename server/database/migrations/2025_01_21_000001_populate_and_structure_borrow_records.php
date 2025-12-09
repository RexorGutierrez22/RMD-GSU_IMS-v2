<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration:
     * 1. Structures the borrow_records table to match borrow_transactions
     * 2. Populates it with active borrows (status = 'borrowed')
     * 3. Sets up the table for future use
     */
    public function up(): void
    {
        // Drop the empty borrow_records table if it exists
        Schema::dropIfExists('borrow_records');

        // Create borrow_records table with same structure as borrow_transactions
        // This will store ONLY active borrows (status = 'borrowed')
        Schema::create('borrow_records', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique(); // Reference to borrow_transactions
            $table->unsignedBigInteger('borrow_transaction_id')->unique(); // Foreign key to borrow_transactions
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('borrower_type')->nullable(); // 'user', 'student', 'employee'
            $table->unsignedBigInteger('borrower_id')->nullable();
            $table->string('borrower_name')->nullable();
            $table->string('borrower_id_number')->nullable();
            $table->string('borrower_email')->nullable();
            $table->string('borrower_contact')->nullable();
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            $table->string('purpose');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['borrowed', 'overdue'])->default('borrowed'); // Only active statuses
            $table->string('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['borrower_type', 'borrower_id']);
            $table->index(['inventory_item_id', 'status']);
            $table->index(['expected_return_date', 'status']);
            $table->index('transaction_id');
            $table->index('borrow_transaction_id');

            // Foreign key to borrow_transactions
            $table->foreign('borrow_transaction_id')
                ->references('id')
                ->on('borrow_transactions')
                ->onDelete('cascade');
        });

        // Populate borrow_records with active borrows from borrow_transactions
        // Check which columns exist in borrow_transactions before selecting
        $columns = Schema::getColumnListing('borrow_transactions');

        $hasBorrowerFields = in_array('borrower_type', $columns) &&
                            in_array('borrower_id', $columns) &&
                            in_array('borrower_name', $columns);

        if ($hasBorrowerFields) {
            // If borrower fields exist, use them
            DB::statement("
                INSERT INTO borrow_records (
                    transaction_id,
                    borrow_transaction_id,
                    user_id,
                    borrower_type,
                    borrower_id,
                    borrower_name,
                    borrower_id_number,
                    borrower_email,
                    borrower_contact,
                    inventory_item_id,
                    quantity,
                    borrow_date,
                    expected_return_date,
                    actual_return_date,
                    purpose,
                    location,
                    notes,
                    status,
                    approved_by,
                    approved_at,
                    created_at,
                    updated_at
                )
                SELECT
                    transaction_id,
                    id as borrow_transaction_id,
                    user_id,
                    borrower_type,
                    borrower_id,
                    borrower_name,
                    borrower_id_number,
                    borrower_email,
                    borrower_contact,
                    inventory_item_id,
                    quantity,
                    borrow_date,
                    expected_return_date,
                    actual_return_date,
                    purpose,
                    location,
                    notes,
                    CASE
                        WHEN status = 'borrowed' AND expected_return_date < CURDATE() THEN 'overdue'
                        WHEN status = 'borrowed' THEN 'borrowed'
                    END as status,
                    approved_by,
                    approved_at,
                    created_at,
                    updated_at
                FROM borrow_transactions
                WHERE status = 'borrowed'
            ");
        } else {
            // If borrower fields don't exist, use NULL/default values
            DB::statement("
                INSERT INTO borrow_records (
                    transaction_id,
                    borrow_transaction_id,
                    user_id,
                    borrower_type,
                    borrower_id,
                    borrower_name,
                    borrower_id_number,
                    borrower_email,
                    borrower_contact,
                    inventory_item_id,
                    quantity,
                    borrow_date,
                    expected_return_date,
                    actual_return_date,
                    purpose,
                    location,
                    notes,
                    status,
                    approved_by,
                    approved_at,
                    created_at,
                    updated_at
                )
                SELECT
                    transaction_id,
                    id as borrow_transaction_id,
                    user_id,
                    NULL as borrower_type,
                    NULL as borrower_id,
                    NULL as borrower_name,
                    NULL as borrower_id_number,
                    NULL as borrower_email,
                    NULL as borrower_contact,
                    inventory_item_id,
                    quantity,
                    borrow_date,
                    expected_return_date,
                    actual_return_date,
                    purpose,
                    location,
                    notes,
                    CASE
                        WHEN status = 'borrowed' AND expected_return_date < CURDATE() THEN 'overdue'
                        WHEN status = 'borrowed' THEN 'borrowed'
                    END as status,
                    approved_by,
                    approved_at,
                    created_at,
                    updated_at
                FROM borrow_transactions
                WHERE status = 'borrowed'
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_records');
    }
};

