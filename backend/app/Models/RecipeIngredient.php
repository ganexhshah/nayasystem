<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    use HasFactory;

    protected $fillable = ['recipe_id', 'item_id', 'quantity', 'unit_id'];

    protected $casts = ['quantity' => 'decimal:2'];

    public function recipe() { return $this->belongsTo(Recipe::class); }
    public function item() { return $this->belongsTo(InventoryItem::class, 'item_id'); }
    public function unit() { return $this->belongsTo(InventoryUnit::class, 'unit_id'); }
}
