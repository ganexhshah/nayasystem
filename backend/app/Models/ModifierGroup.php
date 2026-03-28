<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModifierGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'name', 'min_select', 'max_select', 'is_required', 'is_active',
    ];

    protected $casts = ['is_required' => 'boolean', 'is_active' => 'boolean'];

    public function modifiers() { return $this->hasMany(Modifier::class); }
    public function menuItems() { return $this->belongsToMany(MenuItem::class, 'menu_item_modifier_groups'); }
}
