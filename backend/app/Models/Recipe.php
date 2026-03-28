<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'menu_item_id', 'name', 'yield_quantity', 'yield_unit_id', 'notes',
    ];

    protected $casts = ['yield_quantity' => 'decimal:2'];

    public function menuItem() { return $this->belongsTo(MenuItem::class); }
    public function ingredients() { return $this->hasMany(RecipeIngredient::class); }
}
