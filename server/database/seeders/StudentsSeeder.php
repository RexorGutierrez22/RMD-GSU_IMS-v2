<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = [
            [
                'first_name' => 'Christian',
                'last_name' => 'Lacandula',
                'middle_name' => '',
                'email' => 'ceslacandula@usep.edu.ph',
                'student_id' => '2020-00911',
                'course' => 'BS Information Technology',
                'year_level' => '4th Year',
                'contact_number' => '09150532923',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middle_name' => 'Smith',
                'email' => 'john.doe@rmgsu.edu.ph',
                'student_id' => '2024-001-STU',
                'course' => 'BS Information Technology',
                'year_level' => '3rd Year',
                'contact_number' => '09123456789',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'email' => 'maria.santos@rmgsu.edu.ph',
                'student_id' => '2024-002-STU',
                'course' => 'BS Computer Engineering',
                'year_level' => '2nd Year',
                'contact_number' => '09234567890',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'Michael',
                'last_name' => 'Torres',
                'middle_name' => 'Hernandez',
                'email' => 'michael.torres@rmgsu.edu.ph',
                'student_id' => '2024-003-STU',
                'course' => 'BS Business Administration',
                'year_level' => '4th Year',
                'contact_number' => '09567890123',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'Lisa',
                'last_name' => 'Fernandez',
                'middle_name' => 'Aguilar',
                'email' => 'lisa.fernandez@rmgsu.edu.ph',
                'student_id' => '2024-004-STU',
                'course' => 'BS Biology',
                'year_level' => '1st Year',
                'contact_number' => '09890123456',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($students as $student) {
            DB::table('students')->insert($student);
        }

        $this->command->info('Students seeded successfully!');
    }
}
