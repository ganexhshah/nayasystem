<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'item_id', 'user_id', 'reference_id', 'reference_type',
        'type', 'quantity', 'cost_price', 'notes',
    ];

    protected $casts = ['quantity' => 'decimal:2', 'cost_price' => 'decimal:2'];

    // type: purchase, sale, adjustment, waste, transfer

    public function item() { return $this->belongsTo(InventoryItem::class, 'item_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
