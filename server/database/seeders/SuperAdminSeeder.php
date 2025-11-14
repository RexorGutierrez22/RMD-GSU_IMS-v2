<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing superadmin records (using delete instead of truncate to avoid FK issues)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('superadmin')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $superadmins = [
            [
                'username' => 'rmd_superadmin',
                'password' => Hash::make('rmd@superadmin'),
                'full_name' => 'RMD SUPERADMIN',
                'email' => 'superadmin@rmgsu.edu.ph',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($superadmins as $admin) {
            DB::table('superadmin')->insert($admin);
        }

        $this->command->info('Super Admin seeded successfully!');
        $this->command->info('RMD Super Admin credentials:');
        $this->command->info('Username: rmd_superadmin | Password: rmd@superadmin');
    }
}
