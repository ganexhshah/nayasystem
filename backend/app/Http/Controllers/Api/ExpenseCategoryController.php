<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(ExpenseCategory::where('restaurant_id', $request->user()->restaurant_id)->paginate(50));
    }

    public function store(Request $request)
    {
        $cat = ExpenseCategory::create(array_merge(
            $request->validate(['name' => 'required|string|max:255', 'description' => 'nullable|string|max:1000']),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($cat, 201);
    }

    public function show(Request $request, ExpenseCategory $expenseCategory)
    {
        abort_if($expenseCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($expenseCategory);
    }

    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        abort_if($expenseCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $expenseCategory->update($request->validate(['name' => 'sometimes|string|max:255', 'description' => 'nullable|string|max:1000', 'is_active' => 'nullable|boolean']));
        return response()->json($expenseCategory->fresh());
    }

    public function destroy(Request $request, ExpenseCategory $expenseCategory)
    {
        abort_if($expenseCategory->restaurant_id !== $request->user()->restaurant_id, 403);
        $expenseCategory->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
