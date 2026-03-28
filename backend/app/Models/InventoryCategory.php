<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryCategory extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function items() { return $this->hasMany(InventoryItem::class, 'category_id'); }
}
