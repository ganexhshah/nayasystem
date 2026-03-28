<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name', 'price_monthly', 'price_yearly', 'currency',
        'trial_days', 'features', 'color', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'features'      => 'array',
        'is_active'     => 'boolean',
        'price_monthly' => 'decimal:2',
        'price_yearly'  => 'decimal:2',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
