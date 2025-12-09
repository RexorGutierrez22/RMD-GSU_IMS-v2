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
        // Update admin table with data from admin_registrations for approved registrations
        DB::statement("
            UPDATE admin a
            INNER JOIN admin_registrations ar ON a.email = ar.email
            SET
                a.department = COALESCE(a.department, ar.department),
                a.contact_number = COALESCE(a.contact_number, ar.contact_number),
                a.position = COALESCE(a.position, ar.position)
            WHERE ar.status = 'approved'
            AND (a.department IS NULL OR a.contact_number IS NULL OR a.position IS NULL)
        ");

        // Update superadmin table with data from admin_registrations for approved registrations
        DB::statement("
            UPDATE superadmin sa
            INNER JOIN admin_registrations ar ON sa.email = ar.email
            SET
                sa.department = COALESCE(sa.department, ar.department),
                sa.contact_number = COALESCE(sa.contact_number, ar.contact_number),
                sa.position = COALESCE(sa.position, ar.position)
            WHERE ar.status = 'approved'
            AND ar.requested_role = 'admin'
            AND (sa.department IS NULL OR sa.contact_number IS NULL OR sa.position IS NULL)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration only populates data, so there's nothing to reverse
        // We don't want to delete the data if rollback is called
    }
};

