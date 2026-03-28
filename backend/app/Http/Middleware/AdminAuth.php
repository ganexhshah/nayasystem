<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AdminUser;
use Laravel\Sanctum\PersonalAccessToken;

class AdminAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pat = PersonalAccessToken::findToken($token);
        if (!$pat || $pat->tokenable_type !== AdminUser::class) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $admin = $pat->tokenable;
        if (!$admin || !$admin->is_active) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->setUserResolver(fn() => $admin);
        return $next($request);
    }
}
