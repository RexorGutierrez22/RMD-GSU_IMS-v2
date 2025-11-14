<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middle_name' => 'Smith',
                'type' => 'student',
                'id_number' => '2024-001-STU',
                'email' => 'john.doe@rmgsu.edu.ph',
                'contact_number' => '09123456789',
                'department' => 'College of Computer Science',
                'course' => 'BS Information Technology',
                'year_level' => '3rd Year',
                'address' => '123 Main St, Baguio City',
                'emergency_contact_name' => 'Jane Doe',
                'emergency_contact_number' => '09987654321',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-STU001'
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'type' => 'student',
                'id_number' => '2024-002-STU',
                'email' => 'maria.santos@rmgsu.edu.ph',
                'contact_number' => '09234567890',
                'department' => 'College of Engineering',
                'course' => 'BS Computer Engineering',
                'year_level' => '2nd Year',
                'address' => '456 Oak Ave, Baguio City',
                'emergency_contact_name' => 'Pedro Santos',
                'emergency_contact_number' => '09876543210',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-STU002'
            ],
            [
                'first_name' => 'Robert',
                'last_name' => 'Garcia',
                'middle_name' => 'Luna',
                'type' => 'faculty',
                'id_number' => '2024-001-FAC',
                'email' => 'robert.garcia@rmgsu.edu.ph',
                'contact_number' => '09345678901',
                'department' => 'College of Computer Science',
                'course' => null,
                'year_level' => null,
                'address' => '789 Pine St, Baguio City',
                'emergency_contact_name' => 'Linda Garcia',
                'emergency_contact_number' => '09765432109',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-FAC001'
            ],
            [
                'first_name' => 'Sarah',
                'last_name' => 'Reyes',
                'middle_name' => 'Villanueva',
                'type' => 'employee',
                'id_number' => '2024-001-EMP',
                'email' => 'sarah.reyes@rmgsu.edu.ph',
                'contact_number' => '09456789012',
                'department' => 'Library Services',
                'course' => null,
                'year_level' => null,
                'address' => '321 Elm St, Baguio City',
                'emergency_contact_name' => 'Miguel Reyes',
                'emergency_contact_number' => '09654321098',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-EMP001'
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Torres',
                'middle_name' => 'Hernandez',
                'type' => 'student',
                'id_number' => '2024-003-STU',
                'email' => 'michael.torres@rmgsu.edu.ph',
                'contact_number' => '09567890123',
                'department' => 'College of Business',
                'course' => 'BS Business Administration',
                'year_level' => '4th Year',
                'address' => '654 Maple Dr, Baguio City',
                'emergency_contact_name' => 'Carmen Torres',
                'emergency_contact_number' => '09543210987',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-STU003'
            ],
            [
                'first_name' => 'Jennifer',
                'last_name' => 'Martinez',
                'middle_name' => 'Lopez',
                'type' => 'faculty',
                'id_number' => '2024-002-FAC',
                'email' => 'jennifer.martinez@rmgsu.edu.ph',
                'contact_number' => '09678901234',
                'department' => 'College of Engineering',
                'course' => null,
                'year_level' => null,
                'address' => '987 Cedar Ln, Baguio City',
                'emergency_contact_name' => 'Carlos Martinez',
                'emergency_contact_number' => '09432109876',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-FAC002'
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Gonzales',
                'middle_name' => 'Rivera',
                'type' => 'visitor',
                'id_number' => '2024-001-VIS',
                'email' => 'david.gonzales@gmail.com',
                'contact_number' => '09789012345',
                'department' => 'External Researcher',
                'course' => null,
                'year_level' => null,
                'address' => '159 Birch Rd, Baguio City',
                'emergency_contact_name' => 'Ana Gonzales',
                'emergency_contact_number' => '09321098765',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-VIS001'
            ],
            [
                'first_name' => 'Lisa',
                'last_name' => 'Fernandez',
                'middle_name' => 'Aguilar',
                'type' => 'student',
                'id_number' => '2024-004-STU',
                'email' => 'lisa.fernandez@rmgsu.edu.ph',
                'contact_number' => '09890123456',
                'department' => 'College of Arts and Sciences',
                'course' => 'BS Biology',
                'year_level' => '1st Year',
                'address' => '753 Spruce St, Baguio City',
                'emergency_contact_name' => 'Rosa Fernandez',
                'emergency_contact_number' => '09210987654',
                'status' => 'active',
                'qr_code' => 'RMD-GSU-STU004'
            ]
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }
    }
}
