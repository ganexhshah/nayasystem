<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'area_id', 'name', 'type', 'capacity', 'status',
        'qr_code', 'is_active', 'image', 'description', 'special_features',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'special_features' => 'array',
    ];

    // status: available, occupied, reserved, cleaning
    public function area() { return $this->belongsTo(TableArea::class, 'area_id'); }
    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
