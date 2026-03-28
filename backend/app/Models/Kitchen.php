<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kitchen extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'name', 'type', 'is_active', 'settings',
    ];

    protected $casts = ['is_active' => 'boolean', 'settings' => 'array'];

    // type: default, veg, non_veg
    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function kots() { return $this->hasMany(Kot::class); }
    public function categories() { return $this->belongsToMany(MenuCategory::class, 'kitchen_categories'); }
}
