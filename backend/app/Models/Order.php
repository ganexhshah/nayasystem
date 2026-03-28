<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'table_id', 'customer_id', 'user_id',
        'order_number', 'order_type', 'status', 'payment_status',
        'subtotal', 'tax', 'service_charge', 'discount', 'total',
        'notes', 'delivery_address', 'delivery_fee',
        'rating', 'review', 'waiter_acceptance',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
    ];

    // order_type: dine_in, takeaway, delivery, online
    // status: pending, confirmed, preparing, ready, served, completed, cancelled
    // payment_status: unpaid, partial, paid, refunded

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function table() { return $this->belongsTo(Table::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function kots() { return $this->hasMany(Kot::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
