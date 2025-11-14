<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'borrow_transaction_id',
        'return_verification_id',
        'return_date',
        'condition',
        'return_notes',
        'received_by',
        'damage_fee',
        'inspection_status',
        'inspection_notes',
        'inspected_by',
        'inspected_at'
    ];

    protected $casts = [
        'return_date' => 'date',
        'damage_fee' => 'decimal:2',
        'inspected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the related borrow transaction
     */
    public function borrowTransaction(): BelongsTo
    {
        return $this->belongsTo(BorrowTransaction::class);
    }

    /**
     * Get the related return verification
     */
    public function returnVerification(): BelongsTo
    {
        return $this->belongsTo(ReturnVerification::class, 'return_verification_id');
    }

    /**
     * Get the user who inspected the item
     */
    public function inspectedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    /**
     * Get the user through borrow transaction
     */
    public function user(): BelongsTo
    {
        return $this->borrowTransaction->user();
    }

    /**
     * Get the inventory item through borrow transaction
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->borrowTransaction->inventoryItem();
    }

    /**
     * Check if item was returned damaged
     */
    public function isDamaged(): bool
    {
        return in_array($this->condition, ['damaged', 'lost']);
    }

    /**
     * Check if damage fee was applied
     */
    public function hasDamageFee(): bool
    {
        return $this->damage_fee > 0;
    }

    /**
     * Check if item was returned late
     */
    public function isLateReturn(): bool
    {
        return $this->return_date->gt($this->borrowTransaction->expected_return_date);
    }

    /**
     * Get days late (if any)
     */
    public function getDaysLateAttribute(): int
    {
        if (!$this->isLateReturn()) {
            return 0;
        }

        return $this->return_date->diffInDays($this->borrowTransaction->expected_return_date);
    }

    /**
     * Check if item is pending inspection
     */
    public function isPendingInspection(): bool
    {
        return $this->inspection_status === 'pending_inspection';
    }

    /**
     * Check if item was inspected
     */
    public function isInspected(): bool
    {
        return $this->inspection_status !== 'pending_inspection';
    }

    /**
     * Mark as inspected with condition
     */
    public function markAsInspected(string $inspectionStatus, int $inspectedBy, ?string $notes = null, float $damageFee = 0)
    {
        $this->inspection_status = $inspectionStatus;
        $this->inspected_by = $inspectedBy;
        $this->inspected_at = now();
        $this->inspection_notes = $notes;

        // Update condition based on inspection
        $this->condition = $this->mapInspectionToCondition($inspectionStatus);
        $this->damage_fee = $damageFee;

        $this->save();
        return $this;
    }

    /**
     * Map inspection status to condition
     */
    private function mapInspectionToCondition(string $inspectionStatus): string
    {
        return match($inspectionStatus) {
            'good_condition' => 'good',
            'minor_damage' => 'slightly_damaged',
            'major_damage' => 'damaged',
            'lost' => 'lost',
            'unusable' => 'damaged',
            default => 'good'
        };
    }

    /**
     * Scope to get damaged returns
     */
    public function scopeDamaged($query)
    {
        return $query->whereIn('condition', ['damaged', 'lost']);
    }

    /**
     * Scope to get late returns
     */
    public function scopeLateReturns($query)
    {
        return $query->whereRaw('return_date > (SELECT expected_return_date FROM borrow_transactions WHERE id = borrow_transaction_id)');
    }

    /**
     * Scope to get returns with damage fees
     */
    public function scopeWithDamageFees($query)
    {
        return $query->where('damage_fee', '>', 0);
    }

    /**
     * Scope to get recent returns
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('return_date', 'desc')->limit($limit);
    }

    /**
     * Scope to get pending inspection returns
     */
    public function scopePendingInspection($query)
    {
        return $query->where('inspection_status', 'pending_inspection');
    }

    /**
     * Scope to get inspected returns
     */
    public function scopeInspected($query)
    {
        return $query->where('inspection_status', '!=', 'pending_inspection');
    }
}
