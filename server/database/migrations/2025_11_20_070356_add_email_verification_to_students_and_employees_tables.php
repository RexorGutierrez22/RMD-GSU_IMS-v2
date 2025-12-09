<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add email verification fields to students table
        Schema::table('students', function (Blueprint $table) {
            $table->string('email_verification_code')->nullable()->after('email');
            $table->timestamp('email_verified_at')->nullable()->after('email_verification_code');
            $table->integer('verification_attempts')->default(0)->after('email_verified_at');
            $table->timestamp('verification_code_expires_at')->nullable()->after('verification_attempts');
        });

        // Add email verification fields to employees table
        Schema::table('employees', function (Blueprint $table) {
            $table->string('email_verification_code')->nullable()->after('email');
            $table->timestamp('email_verified_at')->nullable()->after('email_verification_code');
            $table->integer('verification_attempts')->default(0)->after('email_verified_at');
            $table->timestamp('verification_code_expires_at')->nullable()->after('verification_attempts');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['email_verification_code', 'email_verified_at', 'verification_attempts', 'verification_code_expires_at']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['email_verification_code', 'email_verified_at', 'verification_attempts', 'verification_code_expires_at']);
        });
    }
};
