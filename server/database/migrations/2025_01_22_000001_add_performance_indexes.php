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
     * Adds performance indexes to frequently queried columns:
     * - borrow_transactions.status (for filtering by status)
     * - inventory_items.name (for LIKE searches)
     * - inventory_items.available_quantity (for filtering/sorting)
     * - borrow_transactions.borrower_name (for search)
     */
    public function up(): void
    {
        // Add index on borrow_transactions.status
        // This speeds up queries that filter by status (e.g., WHERE status = 'borrowed')
        if (!$this->indexExists('borrow_transactions', 'borrow_transactions_status_index')) {
            Schema::table('borrow_transactions', function (Blueprint $table) {
                $table->index('status', 'borrow_transactions_status_index');
            });
        }

        // Add index on inventory_items.name
        // This speeds up LIKE searches on item names (e.g., WHERE name LIKE '%search%')
        // Note: For full-text search, a FULLTEXT index would be better, but regular index helps with prefix searches
        if (!$this->indexExists('inventory_items', 'inventory_items_name_index')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index('name', 'inventory_items_name_index');
            });
        }

        // Add index on inventory_items.available_quantity
        // This speeds up queries that filter or sort by available quantity
        if (!$this->indexExists('inventory_items', 'inventory_items_available_quantity_index')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index('available_quantity', 'inventory_items_available_quantity_index');
            });
        }

        // Add index on borrow_transactions.borrower_name
        // This speeds up searches by borrower name (e.g., WHERE borrower_name LIKE '%search%')
        if (!$this->indexExists('borrow_transactions', 'borrow_transactions_borrower_name_index')) {
            Schema::table('borrow_transactions', function (Blueprint $table) {
                $table->index('borrower_name', 'borrow_transactions_borrower_name_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes if they exist
        Schema::table('borrow_transactions', function (Blueprint $table) {
            $table->dropIndex('borrow_transactions_status_index');
            $table->dropIndex('borrow_transactions_borrower_name_index');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropIndex('inventory_items_name_index');
            $table->dropIndex('inventory_items_available_quantity_index');
        });
    }

    /**
     * Check if an index exists on a table
     *
     * @param string $table
     * @param string $indexName
     * @return bool
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();

        $result = DB::select(
            "SELECT COUNT(*) as count
             FROM information_schema.statistics
             WHERE table_schema = ?
             AND table_name = ?
             AND index_name = ?",
            [$databaseName, $table, $indexName]
        );

        return $result[0]->count > 0;
    }
};

