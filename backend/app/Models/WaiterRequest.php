<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaiterRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'table_id', 'order_id', 'type', 'status', 'notes',
    ];

    // type: waiter, bill, water, other
    // status: pending, acknowledged, completed

    public function table() { return $this->belongsTo(Table::class); }
    public function order() { return $this->belongsTo(Order::class); }
}
