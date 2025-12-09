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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->nullable(); // Course code like "BSCE", "BSIT"
            $table->string('name'); // Full course name
            $table->string('college')->nullable(); // College name (e.g., "College of Engineering")
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes for better query performance
            $table->index('is_active');
            $table->index('college');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
