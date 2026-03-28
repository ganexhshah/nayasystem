<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'order_id', 'customer_id',
        'amount', 'method', 'status', 'reference', 'notes', 'paid_at',
    ];

    protected $casts = ['amount' => 'decimal:2', 'paid_at' => 'datetime'];

    // method: cash, card, upi, online, due
    // status: pending, completed, failed, refunded

    public function order() { return $this->belongsTo(Order::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
}
