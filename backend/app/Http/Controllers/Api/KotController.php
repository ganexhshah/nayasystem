<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kitchen;
use App\Models\Kot;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KotController extends Controller
{
    public function index(Request $request)
    {
        $query = Kot::with(['order.table', 'items.menuItem', 'kitchen'])
            ->whereHas('order', fn($q) => $q->where('restaurant_id', $request->user()->restaurant_id));

        if ($request->status) $query->where('status', $request->status);
        if ($request->kitchen_id) $query->where('kitchen_id', $request->kitchen_id);

        return response()->json($query->latest()->paginate(50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'kitchen_id' => 'nullable|exists:kitchens,id',
            'items' => 'required|array',
            'notes' => 'nullable|string',
        ]);

        $restaurantId = $request->user()->restaurant_id;
        $order = Order::where('id', $data['order_id'])
            ->where('restaurant_id', $restaurantId)
            ->firstOrFail();

        $kitchenId = null;
        if (!empty($data['kitchen_id'])) {
            $kitchenId = Kitchen::where('id', $data['kitchen_id'])
                ->where('restaurant_id', $restaurantId)
                ->value('id');
            abort_if(!$kitchenId, 403);
        }

        $kot = Kot::create([
            'restaurant_id' => $restaurantId,
            'order_id' => $order->id,
            'kitchen_id' => $kitchenId,
            'kot_number' => 'KOT-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($kot->load(['order', 'items']), 201);
    }

    public function show(Request $request, Kot $kot)
    {
        $this->authorizeRestaurant($request, $kot);
        return response()->json($kot->load(['order.table', 'items.menuItem', 'kitchen']));
    }

    public function update(Request $request, Kot $kot)
    {
        $this->authorizeRestaurant($request, $kot);
        $kot->update($request->only(['notes']));
        return response()->json($kot->fresh());
    }

    public function destroy(Request $request, Kot $kot)
    {
        $this->authorizeRestaurant($request, $kot);
        $kot->update(['status' => 'cancelled']);
        return response()->json(['message' => 'KOT cancelled.']);
    }

    public function updateStatus(Request $request, Kot $kot)
    {
        $this->authorizeRestaurant($request, $kot);
        $request->validate(['status' => 'required|in:pending,preparing,ready,served,cancelled']);
        $kot->update(['status' => $request->status]);
        return response()->json($kot->fresh());
    }

    private function authorizeRestaurant(Request $request, Kot $kot): void
    {
        abort_if($kot->restaurant_id !== $request->user()->restaurant_id, 403);
    }
}
