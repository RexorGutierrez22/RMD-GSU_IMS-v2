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
        Schema::table('inventory_items', function (Blueprint $table) {
            // Add low_stock_threshold as decimal (percentage: 0-100)
            // Nullable to maintain backward compatibility - defaults to 30% in model
            $table->decimal('low_stock_threshold', 5, 2)->nullable()->after('available_quantity')
                ->comment('Low stock threshold percentage (0-100). Null defaults to 30%');
        });

        // Set default threshold to 30% for existing items (maintains current behavior)
        DB::statement("UPDATE inventory_items SET low_stock_threshold = 30.00 WHERE low_stock_threshold IS NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('low_stock_threshold');
        });
    }
};

