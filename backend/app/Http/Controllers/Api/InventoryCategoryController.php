<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;

class InventoryCategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(InventoryCategory::where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $cat = InventoryCategory::create(array_merge(
            $request->validate(['name' => 'required|string', 'description' => 'nullable|string']),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($cat, 201);
    }

    public function show(Request $request, InventoryCategory $inventoryCategory)
    {
        abort_if($inventoryCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($inventoryCategory);
    }

    public function update(Request $request, InventoryCategory $inventoryCategory)
    {
        abort_if($inventoryCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryCategory->update($request->validate(['name' => 'sometimes|string', 'description' => 'nullable|string', 'is_active' => 'nullable|boolean']));
        return response()->json($inventoryCategory->fresh());
    }

    public function destroy(Request $request, InventoryCategory $inventoryCategory)
    {
        abort_if($inventoryCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $inventoryCategory->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
