<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'name', 'description', 'image', 'sort_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function items() { return $this->hasMany(MenuItem::class, 'category_id'); }
}
