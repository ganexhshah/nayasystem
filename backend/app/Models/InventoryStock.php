<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = ['item_id', 'quantity', 'last_updated_at'];

    protected $casts = ['quantity' => 'decimal:2', 'last_updated_at' => 'datetime'];

    public function item() { return $this->belongsTo(InventoryItem::class, 'item_id'); }
}
