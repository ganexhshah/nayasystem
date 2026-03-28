<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        return response()->json(SubscriptionPlan::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $plan = SubscriptionPlan::create($request->validate([
            'name'          => 'required|string|max:100',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly'  => 'required|numeric|min:0',
            'currency'      => 'sometimes|string|max:10',
            'trial_days'    => 'sometimes|integer|min:0',
            'features'      => 'nullable|array',
            'color'         => 'sometimes|string|max:50',
            'is_active'     => 'sometimes|boolean',
            'sort_order'    => 'sometimes|integer',
        ]));
        return response()->json($plan, 201);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->update($request->validate([
            'name'          => 'sometimes|string|max:100',
            'price_monthly' => 'sometimes|numeric|min:0',
            'price_yearly'  => 'sometimes|numeric|min:0',
            'currency'      => 'sometimes|string|max:10',
            'trial_days'    => 'sometimes|integer|min:0',
            'features'      => 'nullable|array',
            'color'         => 'sometimes|string|max:50',
            'is_active'     => 'sometimes|boolean',
            'sort_order'    => 'sometimes|integer',
        ]));
        return response()->json($subscriptionPlan->fresh());
    }

    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
