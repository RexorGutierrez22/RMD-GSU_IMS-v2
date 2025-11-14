<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'emp_id',
        'position',
        'department',
        'contact_number',
        'qr_code',
        'qr_code_path',
        'status'
    ];
}
