<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'item_id', 'quantity', 'received_quantity', 'unit_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'received_quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
    ];

    public function purchaseOrder() { return $this->belongsTo(PurchaseOrder::class); }
    public function item() { return $this->belongsTo(InventoryItem::class, 'item_id'); }
}
