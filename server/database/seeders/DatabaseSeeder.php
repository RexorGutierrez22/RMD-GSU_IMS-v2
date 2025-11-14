<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Seed the inventory management system with separate user tables
        $this->call([
            StudentsSeeder::class,
            EmployeesSeeder::class,
            AdminSeeder::class,
            SuperAdminSeeder::class,
            InventoryItemSeeder::class,
        ]);

        $this->command->info('All database tables seeded successfully!');
        $this->command->info('=== Default Login Credentials ===');
        $this->command->info('Students: Check students table for sample data');
        $this->command->info('Employees: Check employees table for sample data');
        $this->command->info('Admin: Username=Rexor22, Password=rmd@admin');
        $this->command->info('Admin: Username=RMD_Staff, Password=rmd@admin');
        $this->command->info('SuperAdmin: Username=rmd_superadmin, Password=rmd@superadmin');
    }
}
