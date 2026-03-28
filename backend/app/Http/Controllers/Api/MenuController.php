<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Menu::with('items')->where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;
        $menu = Menu::create(array_merge(
            $request->validate(['name' => 'required|string', 'description' => 'nullable|string']),
            ['restaurant_id' => $restaurantId]
        ));

        if ($request->item_ids) {
            $itemIds = collect($request->item_ids)->filter()->map(fn($id) => (int) $id)->values();
            $validIds = MenuItem::whereIn('id', $itemIds)
                ->where('restaurant_id', $restaurantId)
                ->pluck('id');
            abort_if($validIds->count() !== $itemIds->count(), 403);
            $menu->items()->sync($validIds);
        }

        return response()->json($menu->load('items'), 201);
    }

    public function show(Request $request, Menu $menu)
    {
        abort_if($menu->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($menu->load('items.category'));
    }

    public function update(Request $request, Menu $menu)
    {
        abort_if($menu->restaurant_id !== $request->user()->restaurant_id, 403);
        $menu->update($request->validate(['name' => 'sometimes|string', 'description' => 'nullable|string', 'is_active' => 'nullable|boolean']));
        if ($request->has('item_ids')) {
            $itemIds = collect($request->item_ids)->filter()->map(fn($id) => (int) $id)->values();
            $validIds = MenuItem::whereIn('id', $itemIds)
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->pluck('id');
            abort_if($validIds->count() !== $itemIds->count(), 403);
            $menu->items()->sync($validIds);
        }
        return response()->json($menu->fresh()->load('items'));
    }

    public function destroy(Request $request, Menu $menu)
    {
        abort_if($menu->restaurant_id !== $request->user()->restaurant_id, 403);
        $menu->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
