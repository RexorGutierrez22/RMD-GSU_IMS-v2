<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Admin;

class InventoryItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'category',
        'description',
        'total_quantity',
        'available_quantity',
        'low_stock_threshold',
        'type',
        'status',
        'unit_price',
        'location',
        'brand',
        'model',
        'serial_number',
        'purchase_date',
        'size',
        'color',
        'unit',
        'image_path',
        'archived_at',
        'auto_delete_at',
        'archived_by'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'unit_price' => 'decimal:2',
        'low_stock_threshold' => 'decimal:2',
        'archived_at' => 'datetime',
        'auto_delete_at' => 'datetime'
    ];

    // Accessors for frontend compatibility
    public function getItemNameAttribute()
    {
        return $this->name;
    }

    public function getSpecificationAttribute()
    {
        return $this->description;
    }

    public function getQuantityAttribute()
    {
        return $this->available_quantity;
    }

    public function getTotalQuantityAttribute()
    {
        return $this->attributes['total_quantity'];
    }

    public function getQualityAttribute()
    {
        return ucfirst($this->type);
    }

    public function getDateAddedAttribute()
    {
        return $this->created_at ? $this->created_at->format('Y-m-d') : null;
    }

    // Frontend status mapping with 30% threshold for low stock
    public function getFrontendStatusAttribute()
    {
        if ($this->available_quantity == 0) {
            return 'Out of Stock';
        } elseif ($this->isLowStock()) {
            return 'Low Stock';
        } else {
            return 'Available';
        }
    }

    /**
     * Check if item is low stock using dynamic threshold (defaults to 30% if not set)
     *
     * @return bool True if available quantity is at or below the threshold percentage
     */
    public function isLowStock(): bool
    {
        if ($this->total_quantity <= 0) {
            return false;
        }

        // Use dynamic threshold if set, otherwise default to 30%
        $thresholdPercentage = $this->low_stock_threshold ?? 30.0;

        // Ensure threshold is between 0 and 100
        $thresholdPercentage = max(0, min(100, (float)$thresholdPercentage));

        // Calculate threshold quantity based on percentage
        $threshold = $this->total_quantity * ($thresholdPercentage / 100);

        return $this->available_quantity <= $threshold;
    }

    /**
     * Check if sufficient quantity is available
     */
    public function isAvailable(int $quantity): bool
    {
        return $this->available_quantity >= $quantity;
    }

    /**
     * Decrease available quantity when borrowed and update status
     */
    public function borrowQuantity(int $quantity): void
    {
        $this->decrement('available_quantity', $quantity);
        $this->updateStockStatus();
    }

    /**
     * Increase available quantity when returned and update status
     */
    public function returnQuantity(int $quantity): void
    {
        $this->increment('available_quantity', $quantity);
        $this->updateStockStatus();
    }

    /**
     * Update stock status based on current available quantity
     */
    public function updateStockStatus(): void
    {
        if ($this->available_quantity == 0) {
            $this->status = 'out of stock';
        } elseif ($this->isLowStock()) {
            $this->status = 'low stock';
        } else {
            $this->status = 'available';
        }

        $this->save();
    }

    /**
     * Get formatted inventory ID (INV-001, INV-002, etc.)
     */
    public function getFormattedIdAttribute(): string
    {
        return 'INV-' . str_pad($this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get display ID for frontend (same as formatted_id)
     */
    public function getDisplayIdAttribute(): string
    {
        return $this->formatted_id;
    }

    /**
     * Scope to exclude archived items
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope to get only archived items
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Check if item is archived
     */
    public function isArchived(): bool
    {
        return !is_null($this->archived_at);
    }

    /**
     * Archive the item (soft delete with 1 month auto-delete)
     */
    public function archive(?int $archivedBy = null): void
    {
        $this->archived_at = now();
        $this->auto_delete_at = now()->addMonth(); // 1 month countdown
        $this->archived_by = $archivedBy;
        $this->save();
    }

    /**
     * Restore archived item
     */
    public function restoreFromArchive(): void
    {
        $this->archived_at = null;
        $this->auto_delete_at = null;
        $this->archived_by = null;
        $this->save();
    }

    /**
     * Get the admin who archived this item
     */
    public function archivedBy()
    {
        return $this->belongsTo(Admin::class, 'archived_by');
    }

    /**
     * Get days until auto-deletion
     */
    public function getDaysUntilAutoDelete(): ?int
    {
        if (!$this->auto_delete_at) {
            return null;
        }

        $days = now()->diffInDays($this->auto_delete_at, false);
        return $days > 0 ? $days : 0;
    }

    // Relationships
    public function borrowTransactions()
    {
        return $this->hasMany(BorrowTransaction::class);
    }
}
