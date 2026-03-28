<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TableArea;
use Illuminate\Http\Request;

class TableAreaController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(TableArea::with('tables')->where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $area = TableArea::create(array_merge(
            $request->validate(['name' => 'required|string', 'description' => 'nullable|string']),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($area, 201);
    }

    public function show(Request $request, TableArea $tableArea)
    {
        abort_if($tableArea->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($tableArea->load('tables'));
    }

    public function update(Request $request, TableArea $tableArea)
    {
        abort_if($tableArea->restaurant_id !== $request->user()->restaurant_id, 403);
        $tableArea->update($request->validate(['name' => 'sometimes|string', 'description' => 'nullable|string', 'is_active' => 'nullable|boolean']));
        return response()->json($tableArea->fresh());
    }

    public function destroy(Request $request, TableArea $tableArea)
    {
        abort_if($tableArea->restaurant_id !== $request->user()->restaurant_id, 403);
        $tableArea->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
