<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function dateRange(Request $request): array
    {
        return [
            $request->get('from', now()->startOfMonth()->toDateString()),
            $request->get('to', now()->toDateString()),
        ];
    }

    public function sales(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = Order::where('restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as orders'),
                DB::raw('SUM(subtotal) as subtotal'),
                DB::raw('SUM(tax) as tax'),
                DB::raw('SUM(total) as total')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($data);
    }

    public function items(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(orders.created_at)'), [$from, $to])
            ->where('orders.status', 'completed')
            ->select(
                'order_items.name',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('SUM(order_items.price * order_items.quantity) as total')
            )
            ->groupBy('order_items.name')
            ->orderByDesc('quantity')
            ->get();

        return response()->json($data);
    }

    public function categories(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('menu_categories', 'menu_items.category_id', '=', 'menu_categories.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(orders.created_at)'), [$from, $to])
            ->where('orders.status', 'completed')
            ->select(
                'menu_categories.name as category',
                DB::raw('SUM(order_items.quantity) as quantity'),
                DB::raw('SUM(order_items.price * order_items.quantity) as total')
            )
            ->groupBy('menu_categories.name')
            ->orderByDesc('total')
            ->get();

        return response()->json($data);
    }

    public function tax(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = Order::where('restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->where('status', 'completed')
            ->select(DB::raw('SUM(tax) as total_tax'), DB::raw('SUM(total) as total_sales'))
            ->first();

        return response()->json($data);
    }

    public function expenses(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = Expense::with(['category', 'user'])
            ->where('restaurant_id', $restaurantId)
            ->whereBetween('date', [$from, $to])
            ->latest('date')
            ->get();

        return response()->json($data);
    }

    public function payments(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;

        $data = Payment::join('orders', 'payments.order_id', '=', 'orders.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(payments.created_at)'), [$from, $to])
            ->select('payments.method', DB::raw('SUM(payments.amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payments.method')
            ->get();

        return response()->json($data);
    }

    public function duePayments(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = Order::with(['customer', 'payments'])
            ->where('restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->where('payment_status', 'unpaid')
            ->where('status', 'completed')
            ->latest()
            ->get();
        return response()->json($data);
    }

    public function cancelled(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = Order::with(['table', 'user', 'customer'])
            ->where('restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->where('status', 'cancelled')
            ->latest()
            ->get();
        return response()->json($data);
    }

    public function refund(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = Payment::with(['order.customer', 'customer'])
            ->join('orders', 'payments.order_id', '=', 'orders.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(payments.created_at)'), [$from, $to])
            ->where('payments.status', 'refunded')
            ->select('payments.*')
            ->latest('payments.created_at')
            ->get();
        return response()->json($data);
    }

    public function delivery(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = Order::with(['customer', 'payments'])
            ->where('restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->where('order_type', 'delivery')
            ->latest()
            ->get();
        return response()->json($data);
    }

    public function cod(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = Payment::with(['order.customer', 'customer'])
            ->join('orders', 'payments.order_id', '=', 'orders.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween(DB::raw('DATE(payments.created_at)'), [$from, $to])
            ->where('payments.method', 'cash')
            ->where('orders.order_type', 'delivery')
            ->select('payments.*')
            ->latest('payments.created_at')
            ->get();
        return response()->json($data);
    }

    public function loyalty(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $restaurantId = $request->user()->restaurant_id;
        $data = \App\Models\Customer::where('restaurant_id', $restaurantId)
            ->where('loyalty_points', '>', 0)
            ->orderByDesc('loyalty_points')
            ->get();
        return response()->json($data);
    }
}
