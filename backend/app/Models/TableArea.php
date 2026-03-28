<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableArea extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function restaurant() { return $this->belongsTo(Restaurant::class); }
    public function tables() { return $this->hasMany(Table::class, 'area_id'); }
}
