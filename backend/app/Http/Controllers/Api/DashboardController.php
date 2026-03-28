<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function websiteAnalytics(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $today = now()->toDateString();

        // Orders by hour (last 7 days, public orders only — user_id is null)
        $byHour = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', now()->subDays(7))
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('COUNT(*) as count'))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        $hourlyData = [];
        for ($h = 0; $h < 24; $h++) {
            $hourlyData[] = ['hour' => $h, 'count' => $byHour->get($h)?->count ?? 0];
        }

        // Orders by type
        $byType = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', now()->subDays(30))
            ->select('order_type', DB::raw('COUNT(*) as count'))
            ->groupBy('order_type')
            ->get();

        // Top selling items (last 30 days)
        $topItems = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.created_at', '>=', now()->subDays(30))
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as qty'), DB::raw('SUM(order_items.price * order_items.quantity) as revenue'))
            ->groupBy('order_items.name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get();

        // Summary stats
        $todayOrders   = Order::where('restaurant_id', $restaurantId)->whereDate('created_at', $today)->count();
        $weekOrders    = Order::where('restaurant_id', $restaurantId)->where('created_at', '>=', now()->subDays(7))->count();
        $monthOrders   = Order::where('restaurant_id', $restaurantId)->where('created_at', '>=', now()->subDays(30))->count();
        $todayRevenue  = Order::where('restaurant_id', $restaurantId)->whereDate('created_at', $today)->where('status', 'completed')->sum('total');
        $weekRevenue   = Order::where('restaurant_id', $restaurantId)->where('created_at', '>=', now()->subDays(7))->where('status', 'completed')->sum('total');
        $monthRevenue  = Order::where('restaurant_id', $restaurantId)->where('created_at', '>=', now()->subDays(30))->where('status', 'completed')->sum('total');
        $avgRating     = Order::where('restaurant_id', $restaurantId)->whereNotNull('rating')->avg('rating');
        $totalRatings  = Order::where('restaurant_id', $restaurantId)->whereNotNull('rating')->count();

        // Orders by day (last 14 days)
        $byDay = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', now()->subDays(14))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'summary' => [
                'today_orders'  => $todayOrders,
                'week_orders'   => $weekOrders,
                'month_orders'  => $monthOrders,
                'today_revenue' => round($todayRevenue, 2),
                'week_revenue'  => round($weekRevenue, 2),
                'month_revenue' => round($monthRevenue, 2),
                'avg_rating'    => $avgRating ? round($avgRating, 1) : null,
                'total_ratings' => $totalRatings,
            ],
            'orders_by_hour' => $hourlyData,
            'orders_by_type' => $byType,
            'top_items'      => $topItems,
            'orders_by_day'  => $byDay,
        ]);
    }

    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $today = now()->toDateString();
        $thisMonth = now()->startOfMonth();

        $todaySales = Order::where('restaurant_id', $restaurantId)
            ->whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('total');

        $todayOrders = Order::where('restaurant_id', $restaurantId)
            ->whereDate('created_at', $today)
            ->count();

        $monthSales = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', $thisMonth)
            ->where('status', 'completed')
            ->sum('total');

        $totalCustomers = Customer::where('restaurant_id', $restaurantId)->count();

        $pendingOrders = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->count();

        $recentOrders = Order::with(['table', 'customer', 'user'])
            ->where('restaurant_id', $restaurantId)
            ->latest()
            ->limit(10)
            ->get();

        $salesByDay = Order::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', now()->subDays(7))
            ->where('status', 'completed')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Today's orders with full detail
        $todayOrdersDetail = Order::with(['table', 'customer', 'user', 'items', 'payments'])
            ->where('restaurant_id', $restaurantId)
            ->whereDate('created_at', $today)
            ->latest()
            ->get();

        // Payment methods breakdown (today)
        $paymentMethodsToday = DB::table('payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereDate('payments.created_at', $today)
            ->where('payments.status', 'completed')
            ->select('payments.method', DB::raw('COUNT(*) as count'), DB::raw('SUM(payments.amount) as total'))
            ->groupBy('payments.method')
            ->orderByDesc('total')
            ->get();

        // Top selling dishes (today)
        $topSellingDishes = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereDate('orders.created_at', $today)
            ->whereNotIn('orders.status', ['cancelled'])
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as qty'), DB::raw('SUM(order_items.price * order_items.quantity) as revenue'))
            ->groupBy('order_items.name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get();

        // Top selling tables (today)
        $topSellingTables = DB::table('orders')
            ->join('tables', 'tables.id', '=', 'orders.table_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereDate('orders.created_at', $today)
            ->whereNotIn('orders.status', ['cancelled'])
            ->select('tables.name as table_name', DB::raw('COUNT(orders.id) as order_count'), DB::raw('SUM(orders.total) as revenue'))
            ->groupBy('tables.id', 'tables.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        return response()->json([
            'today_sales' => $todaySales,
            'today_orders' => $todayOrders,
            'month_sales' => $monthSales,
            'total_customers' => $totalCustomers,
            'pending_orders' => $pendingOrders,
            'recent_orders' => $recentOrders,
            'sales_by_day' => $salesByDay,
            'today_orders_detail' => $todayOrdersDetail,
            'payment_methods_today' => $paymentMethodsToday,
            'top_selling_dishes' => $topSellingDishes,
            'top_selling_tables' => $topSellingTables,
        ]);
    }
}
