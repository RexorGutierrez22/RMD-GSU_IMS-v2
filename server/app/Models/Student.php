<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

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
        'status'
    ];
}
