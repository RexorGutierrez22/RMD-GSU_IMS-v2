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
        // Helper function to check if foreign key exists
        $hasForeignKey = function($table, $column) {
            try {
                $constraints = DB::select("
                    SELECT CONSTRAINT_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = ?
                    AND COLUMN_NAME = ?
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                ", [$table, $column]);
                return !empty($constraints);
            } catch (\Exception $e) {
                return false;
            }
        };

        // Process inventory_items table
        if (!Schema::hasColumn('inventory_items', 'archived_by')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->unsignedBigInteger('archived_by')->nullable()->after('auto_delete_at');
            });
        }

        if (!$hasForeignKey('inventory_items', 'archived_by')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->foreign('archived_by')->references('id')->on('admin')->onDelete('set null');
            });
        }

        // Add index if column exists but index doesn't
        try {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->index('archived_by');
            });
        } catch (\Exception $e) {
            // Index might already exist, ignore
        }

        // Process students table
        if (!Schema::hasColumn('students', 'archived_by')) {
            Schema::table('students', function (Blueprint $table) {
                $table->unsignedBigInteger('archived_by')->nullable()->after('auto_delete_at');
            });
        }

        if (!$hasForeignKey('students', 'archived_by')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreign('archived_by')->references('id')->on('admin')->onDelete('set null');
            });
        }

        // Add index if column exists but index doesn't
        try {
            Schema::table('students', function (Blueprint $table) {
                $table->index('archived_by');
            });
        } catch (\Exception $e) {
            // Index might already exist, ignore
        }

        // Process employees table
        if (!Schema::hasColumn('employees', 'archived_by')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->unsignedBigInteger('archived_by')->nullable()->after('auto_delete_at');
            });
        }

        if (!$hasForeignKey('employees', 'archived_by')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->foreign('archived_by')->references('id')->on('admin')->onDelete('set null');
            });
        }

        // Add index if column exists but index doesn't
        try {
            Schema::table('employees', function (Blueprint $table) {
                $table->index('archived_by');
            });
        } catch (\Exception $e) {
            // Index might already exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys first, then columns
        try {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropForeign(['archived_by']);
            });
        } catch (\Exception $e) {
            // Foreign key might not exist
        }

        try {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropIndex(['archived_by']);
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        if (Schema::hasColumn('inventory_items', 'archived_by')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                $table->dropColumn('archived_by');
            });
        }

        try {
            Schema::table('students', function (Blueprint $table) {
                $table->dropForeign(['archived_by']);
            });
        } catch (\Exception $e) {
            // Foreign key might not exist
        }

        try {
            Schema::table('students', function (Blueprint $table) {
                $table->dropIndex(['archived_by']);
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        if (Schema::hasColumn('students', 'archived_by')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('archived_by');
            });
        }

        try {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropForeign(['archived_by']);
            });
        } catch (\Exception $e) {
            // Foreign key might not exist
        }

        try {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropIndex(['archived_by']);
            });
        } catch (\Exception $e) {
            // Index might not exist
        }

        if (Schema::hasColumn('employees', 'archived_by')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('archived_by');
            });
        }
    }
};
