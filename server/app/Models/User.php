<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'qr_code',
        'type',
        'first_name',
        'last_name',
        'middle_name',
        'id_number',
        'email',
        'contact_number',
        'department',
        'course',
        'year_level',
        'address',
        'emergency_contact_name',
        'emergency_contact_number',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user's full name.
     */
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Scope a query to only include students.
     */
    public function scopeStudents($query)
    {
        return $query->where('type', 'student');
    }

    /**
     * Scope a query to only include employees.
     */
    public function scopeEmployees($query)
    {
        return $query->where('type', 'employee');
    }

    /**
     * Scope a query to only include faculty.
     */
    public function scopeFaculty($query)
    {
        return $query->where('type', 'faculty');
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Get formatted user ID (USR-001, USR-002, etc.)
     */
    public function getFormattedIdAttribute(): string
    {
        return 'USR-' . str_pad($this->id, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get display ID for frontend (same as formatted_id)
     */
    public function getDisplayIdAttribute(): string
    {
        return $this->formatted_id;
    }
}
