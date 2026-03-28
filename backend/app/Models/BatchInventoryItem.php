<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BatchInventoryItem extends Model
{
    use HasFactory;

    protected $fillable = ['batch_inventory_id', 'item_id', 'quantity', 'notes'];

    protected $casts = ['quantity' => 'decimal:2'];

    public function batch() { return $this->belongsTo(BatchInventory::class, 'batch_inventory_id'); }
    public function item() { return $this->belongsTo(InventoryItem::class, 'item_id'); }
}
