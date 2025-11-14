<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Create return_verifications table - temporary holding area before actual return
        Schema::create('return_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('verification_id')->unique(); // RV-2025-001

            // Borrower information (copied from borrow_transaction)
            $table->string('borrower_type'); // 'student', 'employee', 'user'
            $table->unsignedBigInteger('borrower_id');
            $table->string('borrower_name');
            $table->string('borrower_id_number');
            $table->string('borrower_email')->nullable();
            $table->string('borrower_contact')->nullable();

            // Item information
            $table->unsignedBigInteger('borrow_transaction_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->string('item_name');
            $table->string('item_category')->nullable();
            $table->integer('quantity_returned');

            // Return details
            $table->date('return_date');
            $table->string('returned_by'); // Who physically returned it
            $table->text('return_notes')->nullable();

            // Verification status
            $table->enum('verification_status', [
                'pending_verification',  // Just submitted, waiting for admin
                'verified',              // Admin confirmed items received
                'rejected'               // Admin rejected (items not matching, etc.)
            ])->default('pending_verification');

            // Admin actions
            $table->unsignedBigInteger('verified_by')->nullable(); // Admin user ID
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_notes')->nullable(); // Admin notes
            $table->text('rejection_reason')->nullable(); // If rejected

            $table->timestamps();

            // Foreign keys
            $table->foreign('borrow_transaction_id')
                ->references('id')
                ->on('borrow_transactions')
                ->onDelete('cascade');

            $table->foreign('inventory_item_id')
                ->references('id')
                ->on('inventory_items')
                ->onDelete('cascade');
        });

        // Update return_transactions table to track verification workflow
        Schema::table('return_transactions', function (Blueprint $table) {
            // Add verification tracking
            $table->unsignedBigInteger('return_verification_id')->nullable()->after('id');
            $table->enum('inspection_status', [
                'pending_inspection', // Admin verified receipt, needs quality inspection
                'good_condition',     // Item in good condition
                'minor_damage',       // Minor wear and tear
                'major_damage',       // Significant damage
                'lost',               // Item was lost (if applicable)
                'unusable'            // Item cannot be used anymore
            ])->default('pending_inspection')->after('damage_fee'); // Place after existing columns

            $table->text('inspection_notes')->nullable()->after('inspection_status');
            $table->unsignedBigInteger('inspected_by')->nullable()->after('inspection_notes');
            $table->timestamp('inspected_at')->nullable()->after('inspected_by');

            // Foreign key to return_verifications
            $table->foreign('return_verification_id')
                ->references('id')
                ->on('return_verifications')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('return_transactions', function (Blueprint $table) {
            $table->dropForeign(['return_verification_id']);
            $table->dropColumn([
                'return_verification_id',
                'inspection_status',
                'inspection_notes',
                'inspected_by',
                'inspected_at'
            ]);
        });

        Schema::dropIfExists('return_verifications');
    }
};
