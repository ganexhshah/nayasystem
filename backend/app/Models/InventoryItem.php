<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'category_id', 'unit_id',
        'name', 'sku', 'description', 'cost_price',
        'reorder_level', 'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'reorder_level' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function category() { return $this->belongsTo(InventoryCategory::class, 'category_id'); }
    public function unit() { return $this->belongsTo(InventoryUnit::class, 'unit_id'); }
    public function stock() { return $this->hasOne(InventoryStock::class, 'item_id'); }
    public function movements() { return $this->hasMany(InventoryMovement::class, 'item_id'); }
}
