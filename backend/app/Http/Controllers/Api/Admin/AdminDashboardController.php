<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\SupportTicket;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $mrr = Subscription::where('status', 'active')->where('billing_cycle', 'monthly')->sum('amount');
        $arr = Subscription::where('status', 'active')->where('billing_cycle', 'yearly')->sum('amount');

        // Monthly revenue for last 12 months
        $monthly = Subscription::select(
                DB::raw("TO_CHAR(created_at, 'Mon YYYY') as month"),
                DB::raw("DATE_TRUNC('month', created_at) as month_date"),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as new_subs')
            )
            ->where('created_at', '>=', Carbon::now()->subMonths(12))
            ->groupBy('month', 'month_date')
            ->orderBy('month_date')
            ->get();

        return response()->json([
            'total_restaurants'    => Restaurant::count(),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'total_users'          => User::count(),
            'open_support_tickets' => SupportTicket::whereIn('status', ['open', 'in_progress'])->count(),
            'mrr'                  => (float) $mrr,
            'arr'                  => (float) $arr + ((float) $mrr * 12),
            'monthly_revenue'      => $monthly,
            'recent_restaurants'   => Restaurant::with('subscriptions.plan')
                ->withCount(['users', 'orders'])
                ->latest()->limit(8)->get(),
            'recent_support_tickets' => SupportTicket::with(['restaurant:id,name', 'user:id,name'])
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }
}
