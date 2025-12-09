<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RejectedRegistration extends Model
{
    use HasFactory;

    protected $table = 'rejected_registrations';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'username',
        'password',
        'contact_number',
        'department',
        'position',
        'requested_role',
        'rejection_reason',
        'rejected_at',
        'rejected_by',
        'originally_requested_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'rejected_at' => 'datetime',
        'originally_requested_at' => 'datetime',
    ];

    /**
     * Get the superadmin who rejected this registration.
     */
    public function rejectedBy()
    {
        return $this->belongsTo(SuperAdmin::class, 'rejected_by');
    }
}
