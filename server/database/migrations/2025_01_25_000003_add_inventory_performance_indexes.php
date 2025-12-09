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
        // Add index on status column for faster filtering
        if (!$this->indexExists('inventory_items', 'inventory_items_status_index')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index('status', 'inventory_items_status_index');
            });
        }

        // Add composite index for common filter combinations
        if (!$this->indexExists('inventory_items', 'inventory_items_category_status_index')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index(['category', 'status'], 'inventory_items_category_status_index');
            });
        }

        // Add index on location for filtering
        if (!$this->indexExists('inventory_items', 'inventory_items_location_index')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index('location', 'inventory_items_location_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropIndex('inventory_items_status_index');
            $table->dropIndex('inventory_items_category_status_index');
            $table->dropIndex('inventory_items_location_index');
        });
    }

    /**
     * Check if index exists
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();

        $result = DB::select(
            "SELECT COUNT(*) as count FROM information_schema.statistics
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$databaseName, $table, $index]
        );

        return $result[0]->count > 0;
    }
};

