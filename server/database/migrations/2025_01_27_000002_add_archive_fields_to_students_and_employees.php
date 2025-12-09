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
        // Add archive fields to students table
        Schema::table('students', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('updated_at');
            $table->timestamp('auto_delete_at')->nullable()->after('archived_at');
            $table->softDeletes()->after('auto_delete_at');

            // Index for efficient archive queries
            $table->index('archived_at');
            $table->index('auto_delete_at');
        });

        // Add archive fields to employees table
        Schema::table('employees', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('updated_at');
            $table->timestamp('auto_delete_at')->nullable()->after('archived_at');
            $table->softDeletes()->after('auto_delete_at');

            // Index for efficient archive queries
            $table->index('archived_at');
            $table->index('auto_delete_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['archived_at']);
            $table->dropIndex(['auto_delete_at']);
            $table->dropColumn(['archived_at', 'auto_delete_at', 'deleted_at']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['archived_at']);
            $table->dropIndex(['auto_delete_at']);
            $table->dropColumn(['archived_at', 'auto_delete_at', 'deleted_at']);
        });
    }
};

