<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class AdminRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'username',
        'password',
        'contact_number',
        'department',
        'position',
        'requested_role',
        'status',
        'rejection_reason',
        'approved_at',
        'rejected_at',
        'approved_by'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Hash password when setting
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    /**
     * Get the super admin who approved this registration
     */
    public function approvedBy()
    {
        return $this->belongsTo(SuperAdmin::class, 'approved_by');
    }

    /**
     * Scope for pending registrations
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved registrations
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected registrations
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Check if email is from USEP domain
     */
    public function isUsepEmail(): bool
    {
        return str_ends_with(strtolower($this->email), '@usep.edu.ph');
    }

    /**
     * Get formatted ID for display
     */
    public function getFormattedIdAttribute(): string
    {
        return 'REG-' . str_pad($this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'bg-yellow-100 text-yellow-800',
            'approved' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800'
        };
    }
}
