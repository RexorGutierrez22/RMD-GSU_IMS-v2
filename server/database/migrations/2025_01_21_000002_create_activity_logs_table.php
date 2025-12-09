<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates activity_logs table for tracking all system activities
     * This will be used for Activity Logs Dashboard and Recent Activity
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('activity_type'); // 'borrow_request', 'borrow_approved', 'borrow_rejected', 'return_submitted', 'return_verified', 'inspection_completed', etc.
            $table->string('activity_category')->default('transaction'); // 'transaction', 'inventory', 'user', 'system'
            $table->string('description'); // Human-readable description

            // Related entity references (nullable, as not all activities relate to transactions)
            $table->unsignedBigInteger('borrow_transaction_id')->nullable();
            $table->unsignedBigInteger('return_transaction_id')->nullable();
            $table->unsignedBigInteger('inventory_item_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // User who performed the action
            $table->unsignedBigInteger('admin_user_id')->nullable(); // Admin who performed the action

            // Actor information (who did the action)
            $table->string('actor_type')->nullable(); // 'student', 'employee', 'admin', 'staff', 'system'
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_name')->nullable();

            // Additional metadata (JSON for flexibility)
            $table->json('metadata')->nullable(); // Store additional context

            // Timestamps
            $table->timestamp('activity_date')->useCurrent();
            $table->timestamps();

            // Indexes for performance
            $table->index('activity_type');
            $table->index('activity_category');
            $table->index('activity_date');
            $table->index(['actor_type', 'actor_id']);
            $table->index('borrow_transaction_id');
            $table->index('return_transaction_id');
            $table->index('inventory_item_id');
            $table->index('admin_user_id');

            // Foreign keys
            $table->foreign('borrow_transaction_id')
                ->references('id')
                ->on('borrow_transactions')
                ->onDelete('set null');

            $table->foreign('return_transaction_id')
                ->references('id')
                ->on('return_transactions')
                ->onDelete('set null');

            $table->foreign('inventory_item_id')
                ->references('id')
                ->on('inventory_items')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};

