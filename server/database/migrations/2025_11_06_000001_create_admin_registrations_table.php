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
        Schema::create('admin_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('username')->unique();
            $table->string('password'); // Hashed password
            $table->string('contact_number')->nullable();
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->enum('requested_role', ['admin', 'staff'])->default('staff');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable(); // Super Admin ID
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('approved_by')->references('id')->on('superadmin')->onDelete('set null');

            // Indexes for performance
            $table->index(['status', 'created_at']);
            $table->index('email');
            $table->index('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_registrations');
    }
};
