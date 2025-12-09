<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InventoryItem;
use App\Models\Student;
use App\Models\Employee;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AutoDeleteArchivedItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'archive:auto-delete {--dry-run : Run without actually deleting items}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically delete archived items (inventory, students, employees) that have passed their auto-delete date (1 month after archiving)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🗑️  Checking for archived records ready for auto-deletion...');

        $dryRun = $this->option('dry-run');

        try {
            // Get all archived records where auto_delete_at has passed
            $itemsToDelete = InventoryItem::archived()
                ->where('auto_delete_at', '<=', now())
                ->get();

            $studentsToDelete = Student::archived()
                ->where('auto_delete_at', '<=', now())
                ->get();

            $employeesToDelete = Employee::archived()
                ->where('auto_delete_at', '<=', now())
                ->get();

            $totalCount = $itemsToDelete->count() + $studentsToDelete->count() + $employeesToDelete->count();

            if ($totalCount === 0) {
                $this->info('✅ No archived records ready for auto-deletion.');
                return 0;
            }

            $this->info("📦 Found {$totalCount} archived record(s) ready for permanent deletion.");
            $this->info("   - Inventory items: {$itemsToDelete->count()}");
            $this->info("   - Students: {$studentsToDelete->count()}");
            $this->info("   - Employees: {$employeesToDelete->count()}");

            if ($dryRun) {
                $this->warn('🔍 DRY RUN MODE - No records will be deleted.');
                foreach ($itemsToDelete as $item) {
                    $this->line("  - Inventory: {$item->name} (ID: {$item->id}) - Archived: {$item->archived_at->format('Y-m-d H:i:s')}");
                }
                foreach ($studentsToDelete as $student) {
                    $name = trim("{$student->first_name} {$student->middle_name} {$student->last_name}");
                    $this->line("  - Student: {$name} (ID: {$student->id}) - Archived: {$student->archived_at->format('Y-m-d H:i:s')}");
                }
                foreach ($employeesToDelete as $employee) {
                    $name = trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}");
                    $this->line("  - Employee: {$name} (ID: {$employee->id}) - Archived: {$employee->archived_at->format('Y-m-d H:i:s')}");
                }
                return 0;
            }

            $deletedCount = 0;
            $errors = [];

            // Delete inventory items
            foreach ($itemsToDelete as $item) {
                try {
                    $itemName = $item->name;
                    $itemCategory = $item->category;
                    $itemId = $item->id;

                    $item->forceDelete();

                    ActivityLog::log('inventory_item_permanently_deleted', "Archived inventory item permanently deleted: {$itemName} (Category: {$itemCategory}) - Auto-deleted after 1 month", [
                        'category' => 'inventory',
                        'inventory_item_id' => $itemId,
                        'actor_type' => 'system',
                        'actor_name' => 'Auto-Delete System',
                        'metadata' => [
                            'item_name' => $itemName,
                            'category' => $itemCategory,
                            'archived_at' => $item->archived_at->toDateTimeString(),
                            'auto_delete_at' => $item->auto_delete_at->toDateTimeString(),
                            'permanently_deleted_at' => now()->toDateTimeString()
                        ]
                    ]);

                    $deletedCount++;
                    $this->line("  ✓ Deleted Inventory: {$itemName} (ID: {$itemId})");
                } catch (\Exception $e) {
                    $errors[] = "Failed to delete inventory item ID {$item->id}: {$e->getMessage()}";
                    $this->error("  ✗ Error deleting inventory item ID {$item->id}: {$e->getMessage()}");
                    Log::error('Auto-delete error for inventory item', [
                        'item_id' => $item->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Delete students
            foreach ($studentsToDelete as $student) {
                try {
                    $studentName = trim("{$student->first_name} {$student->middle_name} {$student->last_name}");
                    $studentId = $student->id;

                    // Delete QR code file if exists
                    if ($student->qr_code_path && file_exists(public_path($student->qr_code_path))) {
                        @unlink(public_path($student->qr_code_path));
                    }

                    $student->forceDelete();

                    ActivityLog::log('student_permanently_deleted', "Archived student permanently deleted: {$studentName} (ID: {$student->student_id}) - Auto-deleted after 1 month", [
                        'category' => 'students',
                        'student_id' => $studentId,
                        'actor_type' => 'system',
                        'actor_name' => 'Auto-Delete System',
                        'metadata' => [
                            'student_name' => $studentName,
                            'student_id' => $student->student_id,
                            'archived_at' => $student->archived_at->toDateTimeString(),
                            'auto_delete_at' => $student->auto_delete_at->toDateTimeString(),
                            'permanently_deleted_at' => now()->toDateTimeString()
                        ]
                    ]);

                    $deletedCount++;
                    $this->line("  ✓ Deleted Student: {$studentName} (ID: {$studentId})");
                } catch (\Exception $e) {
                    $errors[] = "Failed to delete student ID {$student->id}: {$e->getMessage()}";
                    $this->error("  ✗ Error deleting student ID {$student->id}: {$e->getMessage()}");
                    Log::error('Auto-delete error for student', [
                        'student_id' => $student->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            // Delete employees
            foreach ($employeesToDelete as $employee) {
                try {
                    $employeeName = trim("{$employee->first_name} {$employee->middle_name} {$employee->last_name}");
                    $employeeId = $employee->id;

                    // Delete QR code file if exists
                    if ($employee->qr_code_path && file_exists(public_path($employee->qr_code_path))) {
                        @unlink(public_path($employee->qr_code_path));
                    }

                    $employee->forceDelete();

                    ActivityLog::log('employee_permanently_deleted', "Archived employee permanently deleted: {$employeeName} (ID: {$employee->emp_id}) - Auto-deleted after 1 month", [
                        'category' => 'employees',
                        'employee_id' => $employeeId,
                        'actor_type' => 'system',
                        'actor_name' => 'Auto-Delete System',
                        'metadata' => [
                            'employee_name' => $employeeName,
                            'emp_id' => $employee->emp_id,
                            'archived_at' => $employee->archived_at->toDateTimeString(),
                            'auto_delete_at' => $employee->auto_delete_at->toDateTimeString(),
                            'permanently_deleted_at' => now()->toDateTimeString()
                        ]
                    ]);

                    $deletedCount++;
                    $this->line("  ✓ Deleted Employee: {$employeeName} (ID: {$employeeId})");
                } catch (\Exception $e) {
                    $errors[] = "Failed to delete employee ID {$employee->id}: {$e->getMessage()}";
                    $this->error("  ✗ Error deleting employee ID {$employee->id}: {$e->getMessage()}");
                    Log::error('Auto-delete error for employee', [
                        'employee_id' => $employee->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

            if ($deletedCount > 0) {
                $this->info("✅ Successfully permanently deleted {$deletedCount} archived record(s).");
            }

            if (!empty($errors)) {
                $failedCount = $totalCount - $deletedCount;
                $this->warn("⚠️  {$failedCount} record(s) could not be deleted. Check logs for details.");
                return 1;
            }

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error during auto-deletion process: {$e->getMessage()}");
            Log::error('Auto-delete command error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }
}

