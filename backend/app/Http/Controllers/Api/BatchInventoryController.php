<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BatchInventory;
use App\Models\BatchInventoryItem;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BatchInventoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            BatchInventory::with(['items.item', 'user'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->latest()->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:production,waste,adjustment',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric',
            'items.*.notes' => 'nullable|string',
        ]);

        $itemIds = collect($data['items'])->pluck('item_id')->unique();
        $ownedItemsCount = InventoryItem::whereIn('id', $itemIds)
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->count();

        if ($ownedItemsCount !== $itemIds->count()) {
            throw ValidationException::withMessages([
                'items' => ['One or more inventory items do not belong to your restaurant.'],
            ]);
        }

        $batch = BatchInventory::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'user_id' => $request->user()->id,
            'batch_number' => 'BATCH-' . strtoupper(Str::random(6)),
            'type' => $data['type'],
            'status' => 'draft',
            'notes' => $data['notes'] ?? null,
        ]);

        foreach ($data['items'] as $item) {
            BatchInventoryItem::create(array_merge($item, ['batch_inventory_id' => $batch->id]));
        }

        return response()->json($batch->load(['items.item', 'user']), 201);
    }

    public function show(Request $request, BatchInventory $batchInventory)
    {
        abort_if($batchInventory->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($batchInventory->load(['items.item.unit', 'user']));
    }

    public function update(Request $request, BatchInventory $batchInventory)
    {
        abort_if($batchInventory->restaurant_id !== $request->user()->restaurant_id, 403);
        if ($request->status === 'completed' && $batchInventory->status === 'draft') {
            // Apply stock changes
            foreach ($batchInventory->items as $item) {
                $stock = \App\Models\InventoryStock::firstOrCreate(['item_id' => $item->item_id], ['quantity' => 0]);
                $delta = $batchInventory->type === 'waste' ? -$item->quantity : $item->quantity;
                $stock->increment('quantity', $delta);
                $stock->update(['last_updated_at' => now()]);
            }
            $batchInventory->update(['status' => 'completed', 'processed_at' => now()]);
        }
        return response()->json($batchInventory->fresh());
    }

    public function destroy(Request $request, BatchInventory $batchInventory)
    {
        abort_if($batchInventory->restaurant_id !== $request->user()->restaurant_id, 403);
        $batchInventory->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function reports(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $data = BatchInventory::with(['items.item'])
            ->where('restaurant_id', $restaurantId)
            ->where('status', 'completed')
            ->latest()->get();
        return response()->json($data);
    }
}
