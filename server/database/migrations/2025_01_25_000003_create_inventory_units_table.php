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
        Schema::create('inventory_units', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default units
        DB::table('inventory_units')->insert([
            ['name' => 'pcs', 'description' => 'Pieces', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'sheets', 'description' => 'Sheets', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'packs', 'description' => 'Packs', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'kits', 'description' => 'Kits', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'kg', 'description' => 'Kilograms', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'lbs', 'description' => 'Pounds', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'boxes', 'description' => 'Boxes', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'sets', 'description' => 'Sets', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'meters', 'description' => 'Meters', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_units');
    }
};

