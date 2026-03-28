<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'menu_item_id', 'kot_id', 'name', 'price',
        'quantity', 'modifiers', 'notes', 'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'modifiers' => 'array',
    ];

    protected $appends = ['is_instant'];

    public function getIsInstantAttribute(): bool
    {
        return (bool) ($this->menuItem?->is_instant ?? false);
    }

    public function order() { return $this->belongsTo(Order::class); }
    public function menuItem() { return $this->belongsTo(MenuItem::class); }
    public function kot() { return $this->belongsTo(Kot::class); }
}
