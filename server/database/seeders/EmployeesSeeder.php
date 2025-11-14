<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = [
            [
                'first_name' => 'Sarah',
                'last_name' => 'Reyes',
                'middle_name' => 'Villanueva',
                'email' => 'sarah.reyes@rmgsu.edu.ph',
                'emp_id' => 'EMP-2024-001',
                'position' => 'Librarian',
                'department' => 'Library Services',
                'contact_number' => '09456789012',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'Robert',
                'last_name' => 'Garcia',
                'middle_name' => 'Luna',
                'email' => 'robert.garcia@rmgsu.edu.ph',
                'emp_id' => 'EMP-2024-002',
                'position' => 'IT Specialist',
                'department' => 'Information Technology',
                'contact_number' => '09345678901',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'first_name' => 'Jennifer',
                'last_name' => 'Martinez',
                'middle_name' => 'Lopez',
                'email' => 'jennifer.martinez@rmgsu.edu.ph',
                'emp_id' => 'EMP-2024-003',
                'position' => 'Research Assistant',
                'department' => 'Research Office',
                'contact_number' => '09678901234',
                'qr_code_path' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($employees as $employee) {
            DB::table('employees')->insert($employee);
        }

        $this->command->info('Employees seeded successfully!');
    }
}
