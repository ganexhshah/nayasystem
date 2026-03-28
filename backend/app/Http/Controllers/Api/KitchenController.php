<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kitchen;
use App\Models\Kot;
use Illuminate\Http\Request;

class KitchenController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Kitchen::where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'type'      => 'required|in:default,veg,non_veg',
            'is_active' => 'nullable|boolean',
        ]);

        $kitchen = Kitchen::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
            'is_active'     => $data['is_active'] ?? true,
        ]));

        return response()->json($kitchen, 201);
    }

    public function update(Request $request, Kitchen $kitchen)
    {
        $this->authorizeKitchen($request, $kitchen);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'type'      => 'sometimes|in:default,veg,non_veg',
            'is_active' => 'nullable|boolean',
        ]);

        $kitchen->update($data);

        return response()->json($kitchen->fresh());
    }

    public function destroy(Request $request, Kitchen $kitchen)
    {
        $this->authorizeKitchen($request, $kitchen);
        $kitchen->delete();
        return response()->json(['message' => 'Kitchen deleted.']);
    }

    public function kots(Request $request, Kitchen $kitchen)
    {
        $this->authorizeKitchen($request, $kitchen);

        $query = Kot::with(['order.table', 'items.menuItem'])
            ->where('kitchen_id', $kitchen->id)
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->whereIn('status', ['pending', 'preparing', 'ready', 'cancelled']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->get());
    }

    private function authorizeKitchen(Request $request, Kitchen $kitchen): void
    {
        abort_if($kitchen->restaurant_id !== $request->user()->restaurant_id, 403);
    }
}
