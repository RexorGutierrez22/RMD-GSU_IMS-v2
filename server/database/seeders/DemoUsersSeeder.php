<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DemoUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates demo users for testing the borrow/return system
     */
    public function run(): void
    {
        // Check if demo users already exist
        $existingStudent = User::where('qr_code', 'STU-2024-001')->first();
        $existingEmployee = User::where('qr_code', 'EMP-2024-001')->first();

        if (!$existingStudent) {
            User::create([
                'qr_code' => 'STU-2024-001',
                'type' => 'Student',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middle_name' => null,
                'id_number' => '20240001',
                'email' => 'john.doe@usep.edu.ph',
                'contact_number' => '+63 912 345 6789',
                'department' => 'College of Computing',
                'course' => 'Computer Science',
                'year_level' => '3rd Year',
                'address' => 'Davao City',
                'emergency_contact_name' => 'Jane Doe',
                'emergency_contact_number' => '+63 912 345 6790',
                'status' => 'active'
            ]);

            $this->command->info('Demo student created: STU-2024-001 (John Doe)');
        } else {
            $this->command->info('Demo student already exists: STU-2024-001');
        }

        if (!$existingEmployee) {
            User::create([
                'qr_code' => 'EMP-2024-001',
                'type' => 'Employee',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'middle_name' => null,
                'id_number' => 'EMP001',
                'email' => 'jane.smith@usep.edu.ph',
                'contact_number' => '+63 918 765 4321',
                'department' => 'Information Technology',
                'course' => null,
                'year_level' => null,
                'address' => 'Davao City',
                'emergency_contact_name' => 'John Smith',
                'emergency_contact_number' => '+63 918 765 4322',
                'status' => 'active'
            ]);

            $this->command->info('Demo employee created: EMP-2024-001 (Jane Smith)');
        } else {
            $this->command->info('Demo employee already exists: EMP-2024-001');
        }

        $this->command->info('Demo users seeding completed!');
    }
}
