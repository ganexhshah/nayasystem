<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryUnit;
use Illuminate\Http\Request;

class InventoryUnitController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(InventoryUnit::where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $unit = InventoryUnit::create(array_merge(
            $request->validate(['name' => 'required|string|max:255', 'abbreviation' => 'required|string|max:5']),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($unit, 201);
    }

    public function show(Request $request, InventoryUnit $inventoryUnit)
    {
        abort_if($inventoryUnit->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($inventoryUnit);
    }

    public function update(Request $request, InventoryUnit $inventoryUnit)
    {
        abort_if($inventoryUnit->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryUnit->update($request->validate(['name' => 'sometimes|string|max:255', 'abbreviation' => 'sometimes|string|max:5']));
        return response()->json($inventoryUnit->fresh());
    }

    public function destroy(Request $request, InventoryUnit $inventoryUnit)
    {
        abort_if($inventoryUnit->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryUnit->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
