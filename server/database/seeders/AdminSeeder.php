<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Clear existing admin records
        DB::table('admin')->truncate();

        // Insert admin records with hashed passwords
        DB::table('admin')->insert([
            [
                'id' => 1,
                'full_name' => 'Rexor Gutierrez',
                'email' => 'ragutierrez@usep.edu.ph',
                'username' => 'Rexor22',
                'password' => Hash::make('rmd@admin'), // Default password
                'remember_token' => null,
                'created_at' => '2025-09-04 20:40:40',
                'updated_at' => '2025-09-04 20:40:40',
            ],
            [
                'id' => 2,
                'full_name' => 'RMD STAFF',
                'email' => 'rmdstaff@usep.edu.ph',
                'username' => 'RMD_Staff',
                'password' => Hash::make('rmd@admin'), // Default password
                'remember_token' => null,
                'created_at' => '2025-09-04 20:42:54',
                'updated_at' => '2025-09-04 20:42:54',
            ],
        ]);

        $this->command->info('Admin users seeded successfully with hashed passwords!');
        $this->command->info('Default password for all admins: rmd@admin');
    }
}
