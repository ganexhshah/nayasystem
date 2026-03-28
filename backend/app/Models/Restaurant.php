<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Subscription;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'logo',
        'currency',
        'timezone',
        'tax_rate',
        'service_charge',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tax_rate' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'settings' => 'array',
    ];

    public function users() { return $this->hasMany(User::class); }
    public function subscriptions() { return $this->hasMany(Subscription::class); }
    public function activeSubscription() { return $this->hasOne(Subscription::class)->where('status', 'active')->latestOfMany(); }
    public function menuCategories() { return $this->hasMany(MenuCategory::class); }
    public function menuItems() { return $this->hasMany(MenuItem::class); }
    public function menus() { return $this->hasMany(Menu::class); }
    public function tableAreas() { return $this->hasMany(TableArea::class); }
    public function tables() { return $this->hasMany(Table::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function customers() { return $this->hasMany(Customer::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
    public function expenses() { return $this->hasMany(Expense::class); }
    public function inventoryItems() { return $this->hasMany(InventoryItem::class); }
}
