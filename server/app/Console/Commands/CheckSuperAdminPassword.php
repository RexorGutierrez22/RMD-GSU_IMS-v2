<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CheckSuperAdminPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'superadmin:check-password {username=rmd_superadmin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the password hash for a superadmin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $username = $this->argument('username');

        $this->info("Checking password for superadmin: {$username}");
        $this->line('');

        $superadmin = DB::table('superadmin')->where('username', $username)->first();

        if (!$superadmin) {
            $this->error("Superadmin '{$username}' not found in database!");
            return 1;
        }

        $this->info("✓ Found superadmin:");
        $this->line("  Username: {$superadmin->username}");
        $this->line("  Email: {$superadmin->email}");
        $this->line("  Full Name: {$superadmin->full_name}");
        $this->line('');

        $this->info("Password Hash Information:");
        $this->line("  Hash (first 50 chars): " . substr($superadmin->password, 0, 50) . "...");
        $this->line("  Hash Length: " . strlen($superadmin->password) . " characters");

        $isHashed = strpos($superadmin->password, '$2y$') === 0 ||
                    strpos($superadmin->password, '$2a$') === 0 ||
                    strpos($superadmin->password, '$2b$') === 0;

        $this->line("  Is Hashed (bcrypt): " . ($isHashed ? "✓ Yes" : "✗ No (plain text)"));
        $this->line('');

        // Test common passwords
        $this->info("Testing Password Verification:");
        $testPasswords = [
            'rmd@superadmin',
            'rmd@admin',
            'admin123',
            'password',
            'superadmin'
        ];

        foreach ($testPasswords as $testPassword) {
            $matches = Hash::check($testPassword, $superadmin->password);
            $status = $matches ? "✓ MATCHES" : "✗ No match";
            $this->line("  '{$testPassword}': {$status}");
        }

        $this->line('');
        $this->info("Note: According to the seeder, the password should be: rmd@superadmin");

        return 0;
    }
}

