<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use Illuminate\Http\Request;

class ModifierController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Modifier::with('group')->whereHas('group', fn($q) => $q->where('restaurant_id', $request->user()->restaurant_id))->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'modifier_group_id' => 'required|exists:modifier_groups,id',
            'name' => 'required|string',
            'price' => 'required|numeric|min:0',
        ]);

        $group = ModifierGroup::where('id', $data['modifier_group_id'])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->firstOrFail();

        $modifier = Modifier::create([
            'modifier_group_id' => $group->id,
            'name' => $data['name'],
            'price' => $data['price'],
        ]);

        return response()->json($modifier, 201);
    }

    public function show(Request $request, Modifier $modifier)
    {
        $this->authorizeRestaurant($request, $modifier);
        return response()->json($modifier->load('group'));
    }

    public function update(Request $request, Modifier $modifier)
    {
        $this->authorizeRestaurant($request, $modifier);
        $modifier->update($request->validate(['name' => 'sometimes|string', 'price' => 'sometimes|numeric|min:0', 'is_active' => 'nullable|boolean']));
        return response()->json($modifier->fresh());
    }

    public function destroy(Request $request, Modifier $modifier)
    {
        $this->authorizeRestaurant($request, $modifier);
        $modifier->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    private function authorizeRestaurant(Request $request, Modifier $modifier): void
    {
        $group = $modifier->group;
        abort_if(!$group || $group->restaurant_id !== $request->user()->restaurant_id, 403);
    }
}
