<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'table_id', 'customer_id',
        'guest_name', 'guest_phone', 'guest_email',
        'party_size', 'reserved_at', 'status', 'notes',
        'special_package', 'pre_order_items', 'package_price',
    ];

    protected $casts = [
        'reserved_at' => 'datetime',
        'pre_order_items' => 'array',
        'package_price' => 'decimal:2',
    ];

    // status: pending, confirmed, seated, completed, cancelled, no_show

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function table() { return $this->belongsTo(Table::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
}
