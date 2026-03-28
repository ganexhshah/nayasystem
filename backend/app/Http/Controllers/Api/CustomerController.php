<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('restaurant_id', $request->user()->restaurant_id);
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }
        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        $customer = Customer::create(array_merge($data, ['restaurant_id' => $request->user()->restaurant_id]));
        return response()->json($customer, 201);
    }

    public function show(Request $request, Customer $customer)
    {
        abort_if($customer->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($customer->load(['orders' => fn($q) => $q->latest()->limit(10)]));
    }

    public function update(Request $request, Customer $customer)
    {
        abort_if($customer->restaurant_id !== $request->user()->restaurant_id, 403);
        $customer->update($request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]));
        return response()->json($customer->fresh());
    }

    public function destroy(Request $request, Customer $customer)
    {
        abort_if($customer->restaurant_id !== $request->user()->restaurant_id, 403);
        $customer->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
