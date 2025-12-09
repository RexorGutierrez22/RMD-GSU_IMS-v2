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
        Schema::table('admin_registrations', function (Blueprint $table) {
            $table->string('email_verification_code')->nullable()->after('email');
            $table->timestamp('email_verified_at')->nullable()->after('email_verification_code');
            $table->integer('verification_attempts')->default(0)->after('email_verified_at');
            $table->timestamp('verification_code_expires_at')->nullable()->after('verification_attempts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admin_registrations', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code',
                'email_verified_at',
                'verification_attempts',
                'verification_code_expires_at'
            ]);
        });
    }
};

