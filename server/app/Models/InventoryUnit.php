<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryUnit extends Model
{
    use HasFactory;

    protected $table = 'inventory_units';

    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all inventory items using this unit
     */
    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'unit', 'name');
    }

    /**
     * Scope to get only active units
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

