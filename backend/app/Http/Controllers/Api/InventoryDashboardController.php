<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;

class InventoryDashboardController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $totalItems = InventoryItem::where('restaurant_id', $restaurantId)->count();

        $lowStockItems = InventoryItem::with(['stock', 'unit'])
            ->where('restaurant_id', $restaurantId)
            ->whereHas('stock', fn($q) => $q->whereColumn('quantity', '<=', 'inventory_items.reorder_level'))
            ->get();

        $recentMovements = InventoryMovement::with(['item'])
            ->where('restaurant_id', $restaurantId)
            ->latest()->limit(10)->get();

        $pendingPOs = PurchaseOrder::with('supplier')
            ->where('restaurant_id', $restaurantId)
            ->whereIn('status', ['draft', 'ordered', 'partial'])
            ->count();

        return response()->json([
            'total_items' => $totalItems,
            'low_stock_items' => $lowStockItems,
            'low_stock_count' => $lowStockItems->count(),
            'recent_movements' => $recentMovements,
            'pending_purchase_orders' => $pendingPOs,
        ]);
    }
}
