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
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default locations
        DB::table('inventory_locations')->insert([
            ['name' => 'Admin Building', 'description' => 'Main administrative building', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Motorpool', 'description' => 'Vehicle maintenance and parking area', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Storage Room A', 'description' => 'Primary storage facility', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Storage Room B', 'description' => 'Secondary storage facility', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Storage Room C', 'description' => 'Tertiary storage facility', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Supply Cabinet', 'description' => 'Office supplies storage', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'IT Room', 'description' => 'Technology equipment storage', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_locations');
    }
};
