<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            InventoryItem::with(['category', 'unit', 'stock'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->paginate(50)
        );
    }

    public function store(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $data = $request->validate([
            'category_id' => 'nullable|exists:inventory_categories,id',
            'unit_id' => 'nullable|exists:inventory_units,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'cost_price' => 'nullable|numeric|min:0|max:999999.99',
            'reorder_level' => 'nullable|numeric|min:0|max:999999',
        ]);

        if (!empty($data['category_id'])) {
            abort_if(
                !\App\Models\InventoryCategory::where('id', $data['category_id'])
                    ->where('restaurant_id', $restaurantId)
                    ->exists(),
                403
            );
        }
        if (!empty($data['unit_id'])) {
            abort_if(
                !\App\Models\InventoryUnit::where('id', $data['unit_id'])
                    ->where('restaurant_id', $restaurantId)
                    ->exists(),
                403
            );
        }

        $item = InventoryItem::create(array_merge($data, ['restaurant_id' => $restaurantId]));
        // Initialize stock
        $item->stock()->create(['quantity' => 0, 'last_updated_at' => now()]);
        return response()->json($item->load(['category', 'unit', 'stock']), 201);
    }

    public function show(Request $request, InventoryItem $inventoryItem)
    {
        abort_if($inventoryItem->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($inventoryItem->load(['category', 'unit', 'stock', 'movements' => fn($q) => $q->latest()->limit(20)]));
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        abort_if($inventoryItem->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'unit_id' => 'nullable|exists:inventory_units,id',
            'cost_price' => 'nullable|numeric|min:0|max:999999.99',
            'reorder_level' => 'nullable|numeric|min:0|max:999999',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($data['category_id'])) {
            abort_if(
                !\App\Models\InventoryCategory::where('id', $data['category_id'])
                    ->where('restaurant_id', $request->user()->restaurant_id)
                    ->exists(),
                403
            );
        }
        if (!empty($data['unit_id'])) {
            abort_if(
                !\App\Models\InventoryUnit::where('id', $data['unit_id'])
                    ->where('restaurant_id', $request->user()->restaurant_id)
                    ->exists(),
                403
            );
        }

        $inventoryItem->update($data);
        return response()->json($inventoryItem->fresh()->load(['category', 'unit', 'stock']));
    }

    public function destroy(Request $request, InventoryItem $inventoryItem)
    {
        abort_if($inventoryItem->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryItem->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
