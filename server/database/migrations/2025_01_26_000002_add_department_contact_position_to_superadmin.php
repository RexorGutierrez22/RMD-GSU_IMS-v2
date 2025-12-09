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
        Schema::table('superadmin', function (Blueprint $table) {
            $table->string('department')->nullable()->after('email');
            $table->string('contact_number')->nullable()->after('department');
            $table->string('position')->nullable()->after('contact_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('superadmin', function (Blueprint $table) {
            $table->dropColumn(['department', 'contact_number', 'position']);
        });
    }
};

