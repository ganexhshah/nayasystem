<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModifierGroup;
use Illuminate\Http\Request;

class ModifierGroupController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(ModifierGroup::with('modifiers')->where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $group = ModifierGroup::create(array_merge(
            $request->validate(['name' => 'required|string', 'min_select' => 'nullable|integer', 'max_select' => 'nullable|integer', 'is_required' => 'nullable|boolean']),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($group, 201);
    }

    public function show(Request $request, ModifierGroup $modifierGroup)
    {
        abort_if($modifierGroup->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($modifierGroup->load('modifiers'));
    }

    public function update(Request $request, ModifierGroup $modifierGroup)
    {
        abort_if($modifierGroup->restaurant_id !== $request->user()->restaurant_id, 403);
        $modifierGroup->update($request->validate(['name' => 'sometimes|string', 'min_select' => 'nullable|integer', 'max_select' => 'nullable|integer', 'is_required' => 'nullable|boolean', 'is_active' => 'nullable|boolean']));
        return response()->json($modifierGroup->fresh());
    }

    public function destroy(Request $request, ModifierGroup $modifierGroup)
    {
        abort_if($modifierGroup->restaurant_id !== $request->user()->restaurant_id, 403);
        $modifierGroup->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
