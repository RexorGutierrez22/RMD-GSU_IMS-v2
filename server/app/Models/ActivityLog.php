<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_type',
        'activity_category',
        'description',
        'borrow_transaction_id',
        'return_transaction_id',
        'inventory_item_id',
        'user_id',
        'admin_user_id',
        'actor_type',
        'actor_id',
        'actor_name',
        'metadata',
        'activity_date'
    ];

    protected $casts = [
        'metadata' => 'array',
        'activity_date' => 'datetime',
    ];

    /**
     * Get the borrow transaction
     */
    public function borrowTransaction(): BelongsTo
    {
        return $this->belongsTo(BorrowTransaction::class);
    }

    /**
     * Get the return transaction
     */
    public function returnTransaction(): BelongsTo
    {
        return $this->belongsTo(ReturnTransaction::class);
    }

    /**
     * Get the inventory item
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * Get the admin user
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_user_id');
    }

    /**
     * Scope to get recent activities
     */
    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderBy('activity_date', 'desc')->limit($limit);
    }

    /**
     * Scope to filter by activity type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('activity_type', $type);
    }

    /**
     * Scope to filter by category
     */
    public function scopeOfCategory($query, string $category)
    {
        return $query->where('activity_category', $category);
    }

    /**
     * Scope to get activities for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get activities for a specific admin
     */
    public function scopeForAdmin($query, int $adminId)
    {
        return $query->where('admin_user_id', $adminId);
    }

    /**
     * Create activity log entry
     */
    public static function log(string $activityType, string $description, array $data = []): self
    {
        return self::create([
            'activity_type' => $activityType,
            'activity_category' => $data['category'] ?? 'transaction',
            'description' => $description,
            'borrow_transaction_id' => $data['borrow_transaction_id'] ?? null,
            'return_transaction_id' => $data['return_transaction_id'] ?? null,
            'inventory_item_id' => $data['inventory_item_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'admin_user_id' => $data['admin_user_id'] ?? null,
            'actor_type' => $data['actor_type'] ?? null,
            'actor_id' => $data['actor_id'] ?? null,
            'actor_name' => $data['actor_name'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'activity_date' => now(),
        ]);
    }
}

