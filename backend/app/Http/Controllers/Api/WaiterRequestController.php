<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Table;
use App\Models\WaiterRequest;
use Illuminate\Http\Request;

class WaiterRequestController extends Controller
{
    public function publicStore(Request $request, string $slug)
    {
        $restaurant = \App\Models\Restaurant::where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'table_id' => 'required|exists:tables,id',
            'type'     => 'required|in:waiter,bill,water,other',
            'notes'    => 'nullable|string',
        ]);

        $table = Table::where('id', $data['table_id'])
            ->where('restaurant_id', $restaurant->id)
            ->firstOrFail();

        $wr = WaiterRequest::create(array_merge($data, [
            'restaurant_id' => $restaurant->id,
            'table_id'      => $table->id,
            'status'        => 'pending',
        ]));
        return response()->json($wr->load('table'), 201);
    }

    public function index(Request $request)
    {
        $query = WaiterRequest::with(['table', 'order'])
            ->where('restaurant_id', $request->user()->restaurant_id);
        if ($request->status) $query->where('status', $request->status);
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $data = $request->validate([
            'table_id' => 'required|exists:tables,id',
            'order_id' => 'nullable|exists:orders,id',
            'type' => 'required|in:waiter,bill,water,other',
            'notes' => 'nullable|string',
        ]);

        abort_if(
            !Table::where('id', $data['table_id'])->where('restaurant_id', $restaurantId)->exists(),
            403
        );
        if (!empty($data['order_id'])) {
            abort_if(
                !Order::where('id', $data['order_id'])->where('restaurant_id', $restaurantId)->exists(),
                403
            );
        }

        $wr = WaiterRequest::create(array_merge($data, [
            'restaurant_id' => $restaurantId,
            'status' => 'pending',
        ]));

        return response()->json($wr->load(['table', 'order']), 201);
    }

    public function show(Request $request, WaiterRequest $waiterRequest)
    {
        abort_if($waiterRequest->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($waiterRequest->load(['table', 'order']));
    }

    public function update(Request $request, WaiterRequest $waiterRequest)
    {
        abort_if($waiterRequest->restaurant_id !== $request->user()->restaurant_id, 403);
        $waiterRequest->update($request->validate(['notes' => 'nullable|string']));
        return response()->json($waiterRequest->fresh());
    }

    public function destroy(Request $request, WaiterRequest $waiterRequest)
    {
        abort_if($waiterRequest->restaurant_id !== $request->user()->restaurant_id, 403);
        $waiterRequest->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function updateStatus(Request $request, WaiterRequest $waiterRequest)
    {
        abort_if($waiterRequest->restaurant_id !== $request->user()->restaurant_id, 403);
        $request->validate(['status' => 'required|in:pending,acknowledged,completed']);
        $waiterRequest->update(['status' => $request->status]);
        return response()->json($waiterRequest->fresh());
    }
}
