<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class BorrowRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'borrow_transaction_id',
        'user_id',
        'borrower_type',
        'borrower_id',
        'borrower_name',
        'borrower_id_number',
        'borrower_email',
        'borrower_contact',
        'inventory_item_id',
        'quantity',
        'borrow_date',
        'expected_return_date',
        'actual_return_date',
        'purpose',
        'location',
        'notes',
        'status',
        'approved_by',
        'approved_at'
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'actual_return_date' => 'date',
        'approved_at' => 'datetime',
        'quantity' => 'integer',
    ];

    /**
     * Get the related borrow transaction
     */
    public function borrowTransaction(): BelongsTo
    {
        return $this->belongsTo(BorrowTransaction::class);
    }

    /**
     * Get the inventory item
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Check if the item is overdue
     */
    public function isOverdue(): bool
    {
        return $this->status === 'borrowed' &&
               Carbon::today()->gt($this->expected_return_date);
    }

    /**
     * Mark as overdue
     */
    public function markAsOverdue(): bool
    {
        if ($this->isOverdue() && $this->status === 'borrowed') {
            $this->status = 'overdue';
            return $this->save();
        }
        return false;
    }

    /**
     * Scope to get borrowed items
     */
    public function scopeBorrowed($query)
    {
        return $query->where('status', 'borrowed');
    }

    /**
     * Scope to get overdue items
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'borrowed')
                    ->where('expected_return_date', '<', now()->toDateString());
    }

    /**
     * Scope to get recent records
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }
}
