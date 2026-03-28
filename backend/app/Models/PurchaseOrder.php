<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'supplier_id', 'user_id',
        'po_number', 'status', 'total', 'notes', 'expected_at', 'received_at',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'expected_at' => 'date',
        'received_at' => 'datetime',
    ];

    // status: draft, ordered, partial, received, cancelled

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class); }
}
