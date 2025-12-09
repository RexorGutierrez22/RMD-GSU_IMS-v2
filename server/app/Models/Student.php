<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Admin;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'student_id',
        'email',
        'contact_number',
        'course',
        'year_level',
        'qr_code',
        'qr_code_path',
        'status',
        'email_verification_code',
        'email_verified_at',
        'verification_attempts',
        'verification_code_expires_at',
        'archived_at',
        'auto_delete_at',
        'archived_by'
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'verification_code_expires_at' => 'datetime',
        'verification_attempts' => 'integer',
        'archived_at' => 'datetime',
        'auto_delete_at' => 'datetime'
    ];

    /**
     * Scope to exclude archived students
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope to get only archived students
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Check if student is archived
     */
    public function isArchived(): bool
    {
        return !is_null($this->archived_at);
    }

    /**
     * Archive the student (soft delete with 1 month auto-delete)
     */
    public function archive(?int $archivedBy = null): void
    {
        $this->archived_at = now();
        $this->auto_delete_at = now()->addMonth(); // 1 month countdown
        $this->archived_by = $archivedBy;
        $this->save();
    }

    /**
     * Restore archived student
     */
    public function restoreFromArchive(): void
    {
        $this->archived_at = null;
        $this->auto_delete_at = null;
        $this->archived_by = null;
        $this->save();
    }

    /**
     * Get the admin who archived this student
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
}
