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
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default categories
        DB::table('inventory_categories')->insert([
            ['name' => 'Carpentry / Masonry', 'description' => 'Construction and building materials', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Fabrication / Welding', 'description' => 'Metal working and fabrication items', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Aircon', 'description' => 'Air conditioning equipment and supplies', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Electronics', 'description' => 'Electronic devices and components', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Furniture', 'description' => 'Office and classroom furniture', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Supplies', 'description' => 'General office and maintenance supplies', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_categories');
    }
};
