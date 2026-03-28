<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'category_id', 'name', 'description', 'price',
        'image', 'is_veg', 'item_type', 'is_available', 'is_instant', 'sort_order', 'sku', 'tax_rate',
        'preparation_time', 'calories', 'tags',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_veg' => 'boolean',
        'is_available' => 'boolean',
        'is_instant' => 'boolean',
        'tags' => 'array',
    ];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function category() { return $this->belongsTo(MenuCategory::class, 'category_id'); }
    public function modifierGroups() { return $this->belongsToMany(ModifierGroup::class, 'menu_item_modifier_groups'); }
    public function menus() { return $this->belongsToMany(Menu::class, 'menu_menu_items'); }
}
