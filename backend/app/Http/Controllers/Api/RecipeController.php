<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryUnit;
use App\Models\MenuItem;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Recipe::with(['menuItem', 'ingredients.item', 'ingredients.unit'])
                ->where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'menu_item_id' => 'nullable|exists:menu_items,id',
            'name' => 'required|string|max:255',
            'yield_quantity' => 'nullable|numeric',
            'yield_unit_id' => 'nullable|exists:inventory_units,id',
            'notes' => 'nullable|string',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.item_id' => 'required|exists:inventory_items,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit_id' => 'nullable|exists:inventory_units,id',
        ]);

        $restaurantId = $request->user()->restaurant_id;

        if (!empty($data['menu_item_id'])) {
            MenuItem::where('id', $data['menu_item_id'])
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        }

        if (!empty($data['yield_unit_id'])) {
            InventoryUnit::where('id', $data['yield_unit_id'])
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        }

        $ingredientItemIds = collect($data['ingredients'])->pluck('item_id')->unique();
        $ingredientItemCount = InventoryItem::whereIn('id', $ingredientItemIds)
            ->where('restaurant_id', $restaurantId)
            ->count();
        if ($ingredientItemCount !== $ingredientItemIds->count()) {
            throw ValidationException::withMessages([
                'ingredients' => ['One or more ingredient items do not belong to your restaurant.'],
            ]);
        }

        $ingredientUnitIds = collect($data['ingredients'])
            ->pluck('unit_id')
            ->filter()
            ->unique();
        if ($ingredientUnitIds->isNotEmpty()) {
            $ingredientUnitCount = InventoryUnit::whereIn('id', $ingredientUnitIds)
                ->where('restaurant_id', $restaurantId)
                ->count();
            if ($ingredientUnitCount !== $ingredientUnitIds->count()) {
                throw ValidationException::withMessages([
                    'ingredients' => ['One or more ingredient units do not belong to your restaurant.'],
                ]);
            }
        }

        $recipe = Recipe::create(array_merge(
            \Arr::except($data, ['ingredients']),
            ['restaurant_id' => $restaurantId]
        ));

        foreach ($data['ingredients'] as $ingredient) {
            RecipeIngredient::create(array_merge($ingredient, ['recipe_id' => $recipe->id]));
        }

        return response()->json($recipe->load(['menuItem', 'ingredients.item', 'ingredients.unit']), 201);
    }

    public function show(Request $request, Recipe $recipe)
    {
        abort_if($recipe->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($recipe->load(['menuItem', 'ingredients.item.unit']));
    }

    public function update(Request $request, Recipe $recipe)
    {
        abort_if($recipe->restaurant_id !== $request->user()->restaurant_id, 403);
        $recipe->update($request->validate(['name' => 'sometimes|string', 'notes' => 'nullable|string']));
        return response()->json($recipe->fresh());
    }

    public function destroy(Request $request, Recipe $recipe)
    {
        abort_if($recipe->restaurant_id !== $request->user()->restaurant_id, 403);
        $recipe->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
