<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('rejected_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('username')->unique();
            $table->string('password');
            $table->string('contact_number')->nullable();
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->enum('requested_role', ['Staff', 'Admin', 'Super Admin'])->default('Staff');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->unsignedBigInteger('rejected_by')->nullable();
            $table->timestamp('originally_requested_at')->nullable();
            $table->timestamps();

            // Foreign key to superadmin who rejected
            $table->foreign('rejected_by')->references('id')->on('superadmin')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('rejected_registrations');
    }
};
