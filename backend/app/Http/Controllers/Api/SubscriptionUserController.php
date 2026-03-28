<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SubscriptionUserController extends Controller
{
    /** Current subscription for the authenticated restaurant */
    public function current(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) return response()->json(['subscription' => null, 'plans' => []]);

        $subscription = Subscription::with('plan')
            ->where('restaurant_id', $restaurant->id)
            ->latest()
            ->first();

        $plans = SubscriptionPlan::where('is_active', true)->orderBy('sort_order')->get();

        return response()->json([
            'subscription' => $subscription,
            'plans'        => $plans,
        ]);
    }

    /** Subscribe or upgrade to a plan */
    public function subscribe(Request $request, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'plan_id'          => 'required|exists:subscription_plans,id',
            'billing_cycle'    => 'required|in:monthly,yearly',
            'payment_method'   => 'nullable|string|max:50',
            'payment_reference'=> 'nullable|string|max:255',
        ]);

        $restaurant = $request->user()->restaurant;
        if (!$restaurant) return response()->json(['message' => 'No restaurant found'], 422);

        $plan = SubscriptionPlan::findOrFail($data['plan_id']);
        $amount = $data['billing_cycle'] === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        $startsAt  = Carbon::now();
        $expiresAt = $data['billing_cycle'] === 'yearly'
            ? $startsAt->copy()->addYear()
            : $startsAt->copy()->addMonth();

        // Cancel any existing active/trial subscriptions
        Subscription::where('restaurant_id', $restaurant->id)
            ->whereIn('status', ['active', 'trial'])
            ->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        $subscription = Subscription::create([
            'restaurant_id'       => $restaurant->id,
            'subscription_plan_id'=> $plan->id,
            'status'              => 'active',
            'billing_cycle'       => $data['billing_cycle'],
            'amount'              => $amount,
            'currency'            => $plan->currency ?? 'NPR',
            'payment_method'      => $data['payment_method'] ?? 'manual',
            'payment_reference'   => $data['payment_reference'] ?? null,
            'starts_at'           => $startsAt,
            'expires_at'          => $expiresAt,
            'auto_renew'          => true,
        ]);

        $businessMailService->sendSubscriptionUpdate($subscription, 'subscribed');

        return response()->json($subscription->load('plan'), 201);
    }

    /** Invoice list — all subscriptions as invoices */
    public function invoices(Request $request)
    {
        $restaurant = $request->user()->restaurant;
        if (!$restaurant) return response()->json([]);

        $invoices = Subscription::with('plan')
            ->where('restaurant_id', $restaurant->id)
            ->latest()
            ->get()
            ->map(fn($s, $i) => [
                'id'            => $s->id,
                'invoice_number'=> 'INV-' . str_pad($s->id, 5, '0', STR_PAD_LEFT),
                'plan'          => $s->plan?->name ?? 'Unknown',
                'billing_cycle' => $s->billing_cycle,
                'amount'        => $s->amount,
                'currency'      => $s->currency,
                'status'        => $s->status,
                'payment_method'=> $s->payment_method,
                'starts_at'     => $s->starts_at,
                'expires_at'    => $s->expires_at,
                'created_at'    => $s->created_at,
            ]);

        return response()->json($invoices);
    }

    /** Cancel current subscription */
    public function cancel(Request $request, BusinessMailService $businessMailService)
    {
        $restaurant = $request->user()->restaurant;
        $sub = Subscription::where('restaurant_id', $restaurant->id)
            ->whereIn('status', ['active', 'trial'])
            ->latest()->first();

        if (!$sub) return response()->json(['message' => 'No active subscription'], 404);

        $sub->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $businessMailService->sendSubscriptionUpdate($sub->fresh('plan'), 'cancelled');
        return response()->json(['message' => 'Subscription cancelled']);
    }
}
