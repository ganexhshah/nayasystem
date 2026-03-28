<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;

class InventoryMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryMovement::with(['item', 'user'])
            ->where('restaurant_id', $request->user()->restaurant_id);
        if ($request->item_id) $query->where('item_id', $request->item_id);
        if ($request->type) $query->where('type', $request->type);
        return response()->json($query->latest()->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'type' => 'required|in:purchase,sale,adjustment,waste,transfer',
            'quantity' => 'required|numeric',
            'cost_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $item = InventoryItem::where('id', $data['item_id'])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->firstOrFail();

        $movement = InventoryMovement::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
            'item_id' => $item->id,
            'user_id' => $request->user()->id,
        ]));

        // Update stock
        $stock = \App\Models\InventoryStock::firstOrCreate(['item_id' => $item->id], ['quantity' => 0]);
        $delta = in_array($data['type'], ['purchase', 'adjustment']) ? $data['quantity'] : -$data['quantity'];
        $stock->increment('quantity', $delta);
        $stock->update(['last_updated_at' => now()]);

        return response()->json($movement->load(['item', 'user']), 201);
    }

    public function show(Request $request, InventoryMovement $inventoryMovement)
    {
        abort_if($inventoryMovement->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($inventoryMovement->load(['item', 'user']));
    }

    public function update(Request $request, InventoryMovement $inventoryMovement)
    {
        abort_if($inventoryMovement->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryMovement->update($request->validate(['notes' => 'nullable|string|max:1000']));
        return response()->json($inventoryMovement->fresh());
    }

    public function destroy(Request $request, InventoryMovement $inventoryMovement)
    {
        abort_if($inventoryMovement->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json(['message' => 'Movements cannot be deleted.'], 422);
    }
}
