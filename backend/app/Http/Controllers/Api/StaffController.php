<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            User::with('roles')
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->where('id', '!=', $request->user()->id)
                ->get()
        );
    }

    public function store(Request $request, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|in:admin,branch_head,manager,cashier,waiter,chef,kitchen,delivery,pos_operator',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'restaurant_id' => $request->user()->restaurant_id,
        ]);

        $user->assignRole($data['role']);
        $businessMailService->sendStaffWelcome($user, $request->user()->restaurant, $data['role']);

        return response()->json($user->load('roles'), 201);
    }

    public function show(Request $request, User $staff)
    {
        abort_if($staff->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($staff->load(['roles', 'permissions']));
    }

    public function update(Request $request, User $staff)
    {
        abort_if($staff->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            'password' => 'nullable|string|min:8',
        ]);
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }
        $staff->update($data);
        return response()->json($staff->fresh()->load('roles'));
    }

    public function destroy(Request $request, User $staff)
    {
        abort_if($staff->restaurant_id !== $request->user()->restaurant_id, 403);
        $staff->delete();
        return response()->json(['message' => 'Staff removed.']);
    }

    public function updatePermissions(Request $request, User $staff, BusinessMailService $businessMailService)
    {
        abort_if($staff->restaurant_id !== $request->user()->restaurant_id, 403);
        $request->validate([
            'role' => 'required|string|in:admin,branch_head,manager,cashier,waiter,chef,kitchen,delivery,pos_operator,owner',
            'permissions' => 'nullable|array',
        ]);
        $staff->syncRoles([$request->role]);
        if ($request->permissions) {
            $staff->syncPermissions($request->permissions);
        }
        $businessMailService->sendStaffRoleUpdated($staff, $request->user()->restaurant, $request->role);
        return response()->json($staff->fresh()->load(['roles', 'permissions']));
    }
}
