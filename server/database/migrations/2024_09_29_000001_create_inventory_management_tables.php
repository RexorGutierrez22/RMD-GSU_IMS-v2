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
        // Create users table (students, employees, faculty)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('qr_code')->unique();
            $table->enum('type', ['student', 'employee', 'faculty', 'visitor']);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->string('id_number')->unique();
            $table->string('email')->unique();
            $table->string('contact_number');
            $table->string('department');

            // Student-specific fields
            $table->string('course')->nullable();
            $table->string('year_level')->nullable();

            // Common fields
            $table->string('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_number')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            // Indexes
            $table->index(['type', 'status']);
            $table->index('qr_code');
            $table->index('id_number');
        });

        // Create inventory_items table
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->text('description')->nullable();
            $table->integer('total_quantity');
            $table->integer('available_quantity');
            $table->enum('type', ['usable', 'consumable']);
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->string('location')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->date('purchase_date')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['category', 'status']);
            $table->index('type');
        });

        // Create borrow_transactions table
        Schema::create('borrow_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            $table->string('purpose');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['borrowed', 'returned', 'overdue', 'lost'])->default('borrowed');
            $table->string('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'status']);
            $table->index(['expected_return_date', 'status']);
            $table->index('transaction_id');
        });

        // Create return_transactions table
        Schema::create('return_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrow_transaction_id')->constrained()->onDelete('cascade');
            $table->date('return_date');
            $table->enum('condition', ['excellent', 'good', 'fair', 'damaged', 'lost']);
            $table->text('return_notes')->nullable();
            $table->string('received_by');
            $table->decimal('damage_fee', 8, 2)->default(0);
            $table->timestamps();

            // Index
            $table->index('return_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_transactions');
        Schema::dropIfExists('borrow_transactions');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('users');
    }
};
