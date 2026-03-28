<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    public function index()
    {
        $totalRestaurants = Restaurant::count();
        $totalUsers       = User::count();

        // MRR from active monthly subscriptions
        $mrr = (float) Subscription::where('status', 'active')
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        // ARR from active yearly + monthly * 12
        $arr = (float) Subscription::where('status', 'active')
            ->where('billing_cycle', 'yearly')
            ->sum('amount');
        $arr += $mrr * 12;

        // Monthly breakdown for last 6 months
        $monthly = Subscription::select(
                DB::raw("TO_CHAR(created_at, 'Mon YYYY') as month"),
                DB::raw("TO_CHAR(created_at, 'YYYY-MM') as sort_key"),
                DB::raw('COUNT(DISTINCT restaurant_id) as new_subs'),
                DB::raw('SUM(amount) as revenue')
            )
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('month', 'sort_key')
            ->orderBy('sort_key')
            ->get();

        // Active restaurants per month (cumulative count)
        $activeRestaurants = Restaurant::where('is_active', true)->count();

        return response()->json([
            'summary' => [
                'total_restaurants' => $totalRestaurants,
                'total_users'       => $totalUsers,
                'mrr'               => $mrr,
                'arr'               => $arr,
            ],
            'monthly' => $monthly,
        ]);
    }
}
