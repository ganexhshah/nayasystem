<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BatchInventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id', 'user_id', 'batch_number', 'type', 'status', 'notes', 'processed_at',
    ];

    protected $casts = ['processed_at' => 'datetime'];

    // type: production, waste, adjustment
    // status: draft, completed

    public function items() { return $this->hasMany(BatchInventoryItem::class); }
    public function user() { return $this->belongsTo(User::class); }
}
