<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kot extends Model
{
    use HasFactory;

    protected $table = 'kots';

    protected $fillable = [
        'restaurant_id', 'order_id', 'kitchen_id', 'kot_number',
        'status', 'notes', 'printed_at',
    ];

    protected $casts = ['printed_at' => 'datetime'];

    // status: pending, preparing, ready, served, cancelled

    public function order() { return $this->belongsTo(Order::class); }
    public function kitchen() { return $this->belongsTo(Kitchen::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
}
