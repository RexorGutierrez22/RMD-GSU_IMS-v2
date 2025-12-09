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
        // Check if admin table exists before trying to modify it
        if (Schema::hasTable('admin')) {
            Schema::table('admin', function (Blueprint $table) {
                // Check if column already exists to avoid duplicate column error
                if (!Schema::hasColumn('admin', 'profile_image')) {
                    $table->string('profile_image')->nullable()->after('username');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if admin table exists and column exists before trying to drop it
        if (Schema::hasTable('admin') && Schema::hasColumn('admin', 'profile_image')) {
            Schema::table('admin', function (Blueprint $table) {
                $table->dropColumn('profile_image');
            });
        }
    }
};

