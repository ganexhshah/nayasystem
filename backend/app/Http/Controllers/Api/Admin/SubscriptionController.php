<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $query = Subscription::with(['restaurant', 'plan']);

        if ($request->status)      $query->where('status', $request->status);
        if ($request->restaurant)  $query->whereHas('restaurant', fn($q) => $q->where('name', 'ilike', "%{$request->restaurant}%"));

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'restaurant_id'        => 'required|exists:restaurants,id',
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'status'               => 'required|in:trial,active,expired,cancelled,suspended',
            'billing_cycle'        => 'required|in:monthly,yearly',
            'amount'               => 'required|numeric|min:0',
            'currency'             => 'sometimes|string|max:10',
            'auto_renew'           => 'sometimes|boolean',
            'payment_method'       => 'nullable|string',
            'starts_at'            => 'nullable|date',
            'expires_at'           => 'nullable|date',
            'trial_ends_at'        => 'nullable|date',
            'notes'                => 'nullable|string',
        ]);

        $sub = Subscription::create($data);
        $businessMailService->sendSubscriptionUpdate($sub->load('plan', 'restaurant'), 'created-by-admin');
        return response()->json($sub->load(['restaurant', 'plan']), 201);
    }

    public function update(Request $request, Subscription $subscription, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'subscription_plan_id' => 'sometimes|exists:subscription_plans,id',
            'status'               => 'sometimes|in:trial,active,expired,cancelled,suspended',
            'billing_cycle'        => 'sometimes|in:monthly,yearly',
            'amount'               => 'sometimes|numeric|min:0',
            'auto_renew'           => 'sometimes|boolean',
            'payment_method'       => 'nullable|string',
            'payment_reference'    => 'nullable|string',
            'starts_at'            => 'nullable|date',
            'expires_at'           => 'nullable|date',
            'notes'                => 'nullable|string',
        ]);

        $subscription->update($data);
        $subscription = $subscription->fresh()->load(['restaurant', 'plan']);

        $businessMailService->sendSubscriptionUpdate($subscription, 'updated-by-admin');
        if (in_array($subscription->status, ['expired', 'suspended'], true)) {
            $businessMailService->sendIssueAlert(
                $subscription->restaurant,
                'Subscription issue detected - '.$subscription->restaurant->name,
                'Your subscription status is now '.$subscription->status.'. Please review your plan and payment settings.'
            );
        }

        return response()->json($subscription);
    }

    public function renew(Subscription $subscription, BusinessMailService $businessMailService)
    {
        $now = Carbon::now();
        $base = $subscription->expires_at && $subscription->expires_at->isFuture()
            ? $subscription->expires_at
            : $now;

        $expires = $subscription->billing_cycle === 'yearly'
            ? $base->addYear()
            : $base->addMonth();

        $subscription->update([
            'status'     => 'active',
            'starts_at'  => $now,
            'expires_at' => $expires,
        ]);

        $subscription = $subscription->fresh()->load(['restaurant', 'plan']);
        $businessMailService->sendSubscriptionUpdate($subscription, 'renewed-by-admin');

        return response()->json($subscription);
    }

    public function cancel(Subscription $subscription, BusinessMailService $businessMailService)
    {
        $subscription->update(['status' => 'cancelled', 'cancelled_at' => now(), 'auto_renew' => false]);
        $subscription = $subscription->fresh()->load(['restaurant', 'plan']);
        $businessMailService->sendSubscriptionUpdate($subscription, 'cancelled-by-admin');
        return response()->json($subscription);
    }

    public function summary()
    {
        $mrr = Subscription::where('status', 'active')->where('billing_cycle', 'monthly')->sum('amount');
        $arr = Subscription::where('status', 'active')->where('billing_cycle', 'yearly')->sum('amount');

        return response()->json([
            'active'    => Subscription::where('status', 'active')->count(),
            'trial'     => Subscription::where('status', 'trial')->count(),
            'expired'   => Subscription::where('status', 'expired')->count(),
            'cancelled' => Subscription::where('status', 'cancelled')->count(),
            'mrr'       => (float) $mrr,
            'arr'       => (float) $arr + ((float) $mrr * 12),
        ]);
    }
}
