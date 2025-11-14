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
        // Step 1: Convert existing data from old values to new values
        DB::statement("UPDATE inventory_items SET status = 'available' WHERE status = 'active'");
        DB::statement("UPDATE inventory_items SET status = 'out of stock' WHERE status = 'inactive'");
        DB::statement("UPDATE inventory_items SET status = 'available' WHERE status = 'maintenance'");

        // Step 2: Now change the enum to match frontend values
        DB::statement("ALTER TABLE inventory_items MODIFY COLUMN status ENUM('available', 'low stock', 'out of stock') DEFAULT 'available'");

        // Step 3: Recalculate all statuses based on actual quantities
        $items = DB::select('SELECT id, available_quantity, total_quantity FROM inventory_items');
        foreach ($items as $item) {
            $status = 'available';
            if ($item->available_quantity == 0) {
                $status = 'out of stock';
            } elseif (($item->available_quantity / $item->total_quantity * 100) < 30) {
                $status = 'low stock';
            }
            DB::update('UPDATE inventory_items SET status = ? WHERE id = ?', [$status, $item->id]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Convert data back to old values
        DB::statement("UPDATE inventory_items SET status = 'active' WHERE status IN ('available', 'low stock')");
        DB::statement("UPDATE inventory_items SET status = 'inactive' WHERE status = 'out of stock'");

        // Revert back to old enum values
        DB::statement("ALTER TABLE inventory_items MODIFY COLUMN status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active'");
    }
};
