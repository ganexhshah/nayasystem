<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            MenuCategory::where('restaurant_id', $request->user()->restaurant_id)
                ->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        $category = MenuCategory::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
        ]));

        return response()->json($category, 201);
    }

    public function show(Request $request, MenuCategory $menuCategory)
    {
        abort_if($menuCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($menuCategory->load('items'));
    }

    public function update(Request $request, MenuCategory $menuCategory)
    {
        abort_if($menuCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $menuCategory->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]));
        return response()->json($menuCategory->fresh());
    }

    public function destroy(Request $request, MenuCategory $menuCategory)
    {
        abort_if($menuCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $menuCategory->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
