<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Subscription;
use Illuminate\Http\Request;

class AdminRestaurantController extends Controller
{
    public function index(Request $request)
    {
        $query = Restaurant::with(['subscriptions.plan', 'users' => fn($q) => $q->limit(1)])
            ->withCount(['users', 'orders']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%")
                  ->orWhere('city', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->whereHas('subscriptions', fn($q) => $q->where('status', $request->status));
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function show(Restaurant $restaurant)
    {
        return response()->json(
            $restaurant->load(['subscriptions.plan', 'users'])
                       ->loadCount(['orders', 'menuItems', 'customers'])
        );
    }

    public function update(Request $request, Restaurant $restaurant)
    {
        $restaurant->update($request->validate([
            'name'       => 'sometimes|string|max:255',
            'email'      => 'nullable|email',
            'phone'      => 'nullable|string',
            'city'       => 'nullable|string',
            'country'    => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
        ]));
        return response()->json($restaurant->fresh());
    }

    public function destroy(Restaurant $restaurant)
    {
        $restaurant->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function stats()
    {
        $total      = Restaurant::count();
        $active     = Subscription::where('status', 'active')->distinct('restaurant_id')->count();
        $trial      = Subscription::where('status', 'trial')->distinct('restaurant_id')->count();
        $expired    = Subscription::where('status', 'expired')->distinct('restaurant_id')->count();
        $mrr        = Subscription::where('status', 'active')->where('billing_cycle', 'monthly')->sum('amount');
        $arr        = Subscription::where('status', 'active')->where('billing_cycle', 'yearly')->sum('amount');

        return response()->json([
            'total_restaurants'    => $total,
            'active_subscriptions' => $active,
            'trial_subscriptions'  => $trial,
            'expired_subscriptions'=> $expired,
            'mrr'                  => (float) $mrr,
            'arr'                  => (float) $arr + ((float) $mrr * 12),
        ]);
    }
}
