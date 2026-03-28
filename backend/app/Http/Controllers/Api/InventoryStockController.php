<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryStockController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            InventoryStock::with(['item.category', 'item.unit'])
                ->whereHas('item', fn($q) => $q->where('restaurant_id', $request->user()->restaurant_id))
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|numeric|min:0|max:999999',
            'type' => 'required|in:purchase,adjustment,waste',
            'notes' => 'nullable|string|max:1000',
        ]);

        $item = InventoryItem::where('id', $data['item_id'])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->firstOrFail();

        DB::transaction(function () use ($item, $data, $request) {
            $stock = InventoryStock::where('item_id', $item->id)->lockForUpdate()->firstOrFail();
            $stock->increment('quantity', $data['quantity']);
            $stock->update(['last_updated_at' => now()]);

            InventoryMovement::create([
                'restaurant_id' => $request->user()->restaurant_id,
                'item_id' => $item->id,
                'user_id' => $request->user()->id,
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'notes' => $data['notes'] ?? null,
            ]);
        });

        return response()->json($item->fresh()->stock);
    }

    public function show(Request $request, InventoryStock $inventoryStock)
    {
        abort_if($inventoryStock->item?->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($inventoryStock->load(['item.category', 'item.unit']));
    }

    public function update(Request $request, InventoryStock $inventoryStock)
    {
        abort_if($inventoryStock->item?->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryStock->update($request->validate(['quantity' => 'required|numeric']));
        $inventoryStock->update(['last_updated_at' => now()]);
        return response()->json($inventoryStock->fresh());
    }

    public function destroy(Request $request, InventoryStock $inventoryStock)
    {
        abort_if($inventoryStock->item?->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json(['message' => 'Cannot delete stock records.'], 422);
    }
}
