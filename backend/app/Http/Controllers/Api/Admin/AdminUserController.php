<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('restaurant:id,name')
            ->select('id', 'name', 'email', 'role', 'restaurant_id', 'created_at');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->restaurant_id) {
            $query->where('restaurant_id', $request->restaurant_id);
        }

        return response()->json($query->latest()->paginate(50));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
