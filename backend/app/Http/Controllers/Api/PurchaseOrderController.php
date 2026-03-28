<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            PurchaseOrder::with(['supplier', 'items.item'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'expected_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $restaurantId = $request->user()->restaurant_id;

        Supplier::where('id', $data['supplier_id'])
            ->where('restaurant_id', $restaurantId)
            ->firstOrFail();

        $itemIds = collect($data['items'])->pluck('item_id')->unique();
        $ownedItemsCount = InventoryItem::whereIn('id', $itemIds)
            ->where('restaurant_id', $restaurantId)
            ->count();

        if ($ownedItemsCount !== $itemIds->count()) {
            throw ValidationException::withMessages([
                'items' => ['One or more inventory items do not belong to your restaurant.'],
            ]);
        }

        $total = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);

        $po = PurchaseOrder::create([
            'restaurant_id' => $restaurantId,
            'supplier_id' => $data['supplier_id'],
            'user_id' => $request->user()->id,
            'po_number' => 'PO-' . strtoupper(Str::random(8)),
            'status' => 'draft',
            'total' => $total,
            'expected_at' => $data['expected_at'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        foreach ($data['items'] as $item) {
            PurchaseOrderItem::create(array_merge($item, ['purchase_order_id' => $po->id, 'received_quantity' => 0]));
        }

        return response()->json($po->load(['supplier', 'items.item']), 201);
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($purchaseOrder->load(['supplier', 'items.item.unit']));
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->restaurant_id !== $request->user()->restaurant_id, 403);
        $purchaseOrder->update($request->validate([
            'status' => 'sometimes|in:draft,ordered,partial,received,cancelled',
            'notes' => 'nullable|string',
            'expected_at' => 'nullable|date',
        ]));
        return response()->json($purchaseOrder->fresh());
    }

    public function destroy(Request $request, PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->restaurant_id !== $request->user()->restaurant_id, 403);
        $purchaseOrder->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Cancelled.']);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        abort_if($purchaseOrder->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.received_quantity' => 'required|numeric|min:0',
        ]);

        $poItemIds = collect($data['items'])->pluck('id')->unique();
        $ownedPoItemsCount = PurchaseOrderItem::whereIn('id', $poItemIds)
            ->where('purchase_order_id', $purchaseOrder->id)
            ->count();

        if ($ownedPoItemsCount !== $poItemIds->count()) {
            throw ValidationException::withMessages([
                'items' => ['One or more purchase order items do not belong to this purchase order.'],
            ]);
        }

        foreach ($data['items'] as $item) {
            $poItem = PurchaseOrderItem::where('purchase_order_id', $purchaseOrder->id)
                ->findOrFail($item['id']);
            $poItem->update(['received_quantity' => $item['received_quantity']]);

            // Update stock
            $stock = InventoryStock::firstOrCreate(['item_id' => $poItem->item_id], ['quantity' => 0]);
            $stock->increment('quantity', $item['received_quantity']);
            $stock->update(['last_updated_at' => now()]);

            InventoryMovement::create([
                'restaurant_id' => $request->user()->restaurant_id,
                'item_id' => $poItem->item_id,
                'user_id' => $request->user()->id,
                'reference_id' => $purchaseOrder->id,
                'reference_type' => 'purchase_order',
                'type' => 'purchase',
                'quantity' => $item['received_quantity'],
                'cost_price' => $poItem->unit_price,
            ]);
        }

        $purchaseOrder->update(['status' => 'received', 'received_at' => now()]);
        return response()->json($purchaseOrder->fresh()->load(['supplier', 'items.item']));
    }
}
