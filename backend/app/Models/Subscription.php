<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'restaurant_id', 'subscription_plan_id', 'status', 'billing_cycle',
        'amount', 'currency', 'auto_renew', 'payment_method', 'payment_reference',
        'trial_ends_at', 'starts_at', 'expires_at', 'cancelled_at', 'notes',
    ];

    protected $casts = [
        'auto_renew'     => 'boolean',
        'trial_ends_at'  => 'datetime',
        'starts_at'      => 'datetime',
        'expires_at'     => 'datetime',
        'cancelled_at'   => 'datetime',
        'amount'         => 'decimal:2',
    ];

    public function restaurant()   { return $this->belongsTo(Restaurant::class); }
    public function plan()         { return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id'); }
}
