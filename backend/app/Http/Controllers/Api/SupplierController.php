<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Supplier::where('restaurant_id', $request->user()->restaurant_id)->get());
    }

    public function store(Request $request)
    {
        $supplier = Supplier::create(array_merge(
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'contact_person' => 'nullable|string',
                'notes' => 'nullable|string',
            ]),
            ['restaurant_id' => $request->user()->restaurant_id]
        ));
        return response()->json($supplier, 201);
    }

    public function show(Request $request, Supplier $supplier)
    {
        abort_if($supplier->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($supplier->load('purchaseOrders'));
    }

    public function update(Request $request, Supplier $supplier)
    {
        abort_if($supplier->restaurant_id !== $request->user()->restaurant_id, 403);
        $supplier->update($request->validate([
            'name' => 'sometimes|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]));
        return response()->json($supplier->fresh());
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        abort_if($supplier->restaurant_id !== $request->user()->restaurant_id, 403);
        $supplier->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
