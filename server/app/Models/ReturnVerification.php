<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ReturnVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'verification_id',
        'borrower_type',
        'borrower_id',
        'borrower_name',
        'borrower_id_number',
        'borrower_email',
        'borrower_contact',
        'borrow_transaction_id',
        'inventory_item_id',
        'item_name',
        'item_category',
        'quantity_returned',
        'return_date',
        'returned_by',
        'return_notes',
        'verification_status',
        'verified_by',
        'verified_at',
        'verification_notes',
        'rejection_reason'
    ];

    protected $casts = [
        'return_date' => 'date',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Boot method - Auto-generate verification ID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->verification_id)) {
                $model->verification_id = self::generateVerificationId();
            }
        });
    }

    /**
     * Generate unique verification ID: RV-2025-001
     */
    public static function generateVerificationId()
    {
        $year = Carbon::now()->year;
        $prefix = "RV-{$year}-";

        // Get last verification for this year
        $lastVerification = self::where('verification_id', 'like', "{$prefix}%")
            ->orderBy('verification_id', 'desc')
            ->first();

        if ($lastVerification) {
            // Extract number and increment
            $lastNumber = intval(substr($lastVerification->verification_id, -3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Relationships
     */
    public function borrowTransaction()
    {
        return $this->belongsTo(BorrowTransaction::class, 'borrow_transaction_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function verifiedByUser()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function returnTransaction()
    {
        return $this->hasOne(ReturnTransaction::class, 'return_verification_id');
    }

    /**
     * Scopes
     */
    public function scopePendingVerification($query)
    {
        return $query->where('verification_status', 'pending_verification');
    }

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeRejected($query)
    {
        return $query->where('verification_status', 'rejected');
    }

    /**
     * Helper Methods
     */
    public function isPending()
    {
        return $this->verification_status === 'pending_verification';
    }

    public function isVerified()
    {
        return $this->verification_status === 'verified';
    }

    public function isRejected()
    {
        return $this->verification_status === 'rejected';
    }

    /**
     * Mark as verified by admin
     */
    public function markAsVerified($adminUserId, $notes = null)
    {
        $this->verification_status = 'verified';
        $this->verified_by = $adminUserId;
        $this->verified_at = Carbon::now();
        $this->verification_notes = $notes;
        $this->save();

        return $this;
    }

    /**
     * Reject verification
     */
    public function reject($adminUserId, $reason)
    {
        $this->verification_status = 'rejected';
        $this->verified_by = $adminUserId;
        $this->verified_at = Carbon::now();
        $this->rejection_reason = $reason;
        $this->save();

        return $this;
    }
}
