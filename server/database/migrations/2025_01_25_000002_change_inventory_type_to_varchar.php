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
     * @return void
     */
    public function up()
    {
        // Change type from ENUM to VARCHAR to allow custom types
        Schema::table('inventory_items', function (Blueprint $table) {
            // First, we need to drop the enum and recreate as string
            // MySQL doesn't support direct enum to varchar conversion
            DB::statement("ALTER TABLE inventory_items MODIFY COLUMN type VARCHAR(50) NOT NULL");
        });

        // Ensure existing values are preserved (usable/consumable)
        // No data migration needed as values are already valid strings
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Convert back to enum (only usable/consumable)
        Schema::table('inventory_items', function (Blueprint $table) {
            // Convert any custom types back to 'usable' as default
            DB::statement("UPDATE inventory_items SET type = 'usable' WHERE type NOT IN ('usable', 'consumable')");
            DB::statement("ALTER TABLE inventory_items MODIFY COLUMN type ENUM('usable', 'consumable') NOT NULL");
        });
    }
};

