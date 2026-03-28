<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $fillable = [
        'restaurant_id', 'name', 'email', 'phone', 'address',
        'password', 'firebase_uid', 'avatar', 'saved_addresses',
        'loyalty_points', 'total_orders', 'total_spent', 'notes', 'is_active',
    ];

    protected $hidden = ['password', 'firebase_uid'];

    protected $casts = [
        'loyalty_points'  => 'integer',
        'total_orders'    => 'integer',
        'total_spent'     => 'decimal:2',
        'saved_addresses' => 'array',
        'is_active'       => 'boolean',
    ];

    public function restaurant()  { return $this->belongsTo(Restaurant::class); }
    public function orders()      { return $this->hasMany(Order::class); }
    public function reservations(){ return $this->hasMany(Reservation::class); }
}
