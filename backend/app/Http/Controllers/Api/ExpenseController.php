<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('category')->where('restaurant_id', $request->user()->restaurant_id);
        if ($request->category_id) $query->where('category_id', $request->category_id);
        if ($request->from) $query->where('date', '>=', $request->from);
        if ($request->to) $query->where('date', '<=', $request->to);
        return response()->json($query->latest('date')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        ExpenseCategory::where('id', $data['category_id'])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->firstOrFail();

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 's3');
            $data['receipt'] = Storage::disk('s3')->url($path);
        }

        $expense = Expense::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
            'user_id' => $request->user()->id,
        ]));

        return response()->json($expense->load('category'), 201);
    }

    public function show(Request $request, Expense $expense)
    {
        abort_if($expense->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($expense->load('category'));
    }

    public function update(Request $request, Expense $expense)
    {
        abort_if($expense->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'category_id' => 'sometimes|exists:expense_categories,id',
            'title' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        if (array_key_exists('category_id', $data) && $data['category_id']) {
            ExpenseCategory::where('id', $data['category_id'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->firstOrFail();
        }

        $expense->update($data);
        return response()->json($expense->fresh()->load('category'));
    }

    public function destroy(Request $request, Expense $expense)
    {
        abort_if($expense->restaurant_id !== $request->user()->restaurant_id, 403);
        $expense->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
