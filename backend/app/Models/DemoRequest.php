<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemoRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'restaurant_name',
        'city',
        'team_size',
        'preferred_date',
        'message',
        'status',
        'scheduled_at',
        'accepted_at',
        'admin_note',
    ];

    protected $casts = [
        'team_size' => 'integer',
        'scheduled_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];
}
