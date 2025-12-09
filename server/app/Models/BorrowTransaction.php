<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class BorrowTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
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
        'approved_at',
        'overdue_notification_sent_at',
        'due_soon_notification_sent_at',
        'due_today_notification_sent_at'
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'actual_return_date' => 'date',
        'approved_at' => 'datetime',
        'overdue_notification_sent_at' => 'datetime',
        'due_soon_notification_sent_at' => 'datetime',
        'due_today_notification_sent_at' => 'datetime',
        'quantity' => 'integer',
    ];

    /**
     * Generate unique transaction ID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->transaction_id)) {
                $model->transaction_id = 'BRW-' . strtoupper(uniqid());
            }
        });
    }

    /**
     * Get the user who borrowed the item
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the borrowed inventory item
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Get the return transaction
     */
    public function returnTransaction(): HasOne
    {
        return $this->hasOne(ReturnTransaction::class);
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
     * Get days overdue
     */
    public function getDaysOverdueAttribute(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }

        return Carbon::today()->diffInDays($this->expected_return_date);
    }

    /**
     * Check if item is currently borrowed
     */
    public function isBorrowed(): bool
    {
        return $this->status === 'borrowed';
    }

    /**
     * Check if item has been returned
     */
    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }

    /**
     * Mark as returned
     */
    public function markAsReturned(string $receivedBy, array $returnData = []): bool
    {
        $this->status = 'returned';
        $this->actual_return_date = $returnData['return_date'] ?? now()->toDateString();

        // Create return transaction record
        $this->returnTransaction()->create([
            'return_date' => $this->actual_return_date,
            'condition' => $returnData['condition'] ?? 'good',
            'return_notes' => $returnData['notes'] ?? null,
            'received_by' => $receivedBy,
            'damage_fee' => $returnData['damage_fee'] ?? 0,
        ]);

        // Update inventory quantity
        $this->inventoryItem->returnQuantity($this->quantity);

        return $this->save();
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
     * Scope to get returned items
     */
    public function scopeReturned($query)
    {
        return $query->where('status', 'returned');
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
     * Scope to get items for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get recent transactions
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }

    /**
     * Get formatted borrow transaction ID (BRW-001, BRW-002, etc.)
     */
    public function getFormattedIdAttribute(): string
    {
        return 'BRW-' . str_pad($this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get display ID for frontend (same as formatted_id)
     */
    public function getDisplayIdAttribute(): string
    {
        return $this->formatted_id;
    }
}
