<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'total_quantity',
        'available_quantity',
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
        'unit'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'unit_price' => 'decimal:2'
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
     * Check if item is low stock (30% or below of total quantity)
     */
    public function isLowStock(): bool
    {
        if ($this->total_quantity <= 0) {
            return false;
        }

        $threshold = $this->total_quantity * 0.30; // 30% threshold
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

    // Relationships
    public function borrowTransactions()
    {
        return $this->hasMany(BorrowTransaction::class);
    }
}
