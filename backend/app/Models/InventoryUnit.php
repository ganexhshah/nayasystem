<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryUnit extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id', 'name', 'abbreviation'];

    public function items() { return $this->hasMany(InventoryItem::class, 'unit_id'); }
}
