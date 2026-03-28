<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use App\Support\GoogleIdentityVerifier;
use App\Services\MailService;

class AuthController extends Controller
{
    public function register(Request $request, MailService $mailService)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => ['required', 'string', 'confirmed', new \App\Rules\ComplexPassword()],
            'restaurant_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $restaurant = Restaurant::create([
            'name' => $data['restaurant_name'],
            'slug' => \Str::slug($data['restaurant_name']) . '-' . \Str::random(4),
            'email' => $data['email'],
            'currency' => 'NPR',
            'timezone' => 'Asia/Kathmandu',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'restaurant_id' => $restaurant->id,
        ]);

        $user->assignRole('owner');
        $mailService->sendWelcomeEmail($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('restaurant'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::whereRaw('LOWER(email) = ?', [Str::lower($data['email'])])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->is_active === false) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('restaurant'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('restaurant', 'roles', 'permissions'));
    }

    public function googleAuth(
        Request $request,
        FirebaseAuth $auth,
        GoogleIdentityVerifier $googleIdentityVerifier,
        MailService $mailService
    )
    {
        $request->validate(['id_token' => 'required|string']);

        try {
            $identity = $googleIdentityVerifier->verify($request->id_token, $auth);
        } catch (\Throwable $e) {
            Log::warning('Owner Google auth token verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid Firebase token.'], 401);
        }

        $uid = $identity['uid'];
        $email = $identity['email'];
        $name = $identity['name'] ?? explode('@', $email)[0];

        if (!$email) {
            return response()->json(['message' => 'Google account has no email.'], 422);
        }

        $user = User::whereRaw('LOWER(email) = ?', [Str::lower($email)])->first();
        $isNewUser = false;

        if (!$user) {
            $isNewUser = true;
            // Auto-create restaurant + owner account
            $restaurant = Restaurant::create([
                'name'     => $name . "'s Restaurant",
                'slug'     => Str::slug($name) . '-' . Str::random(4),
                'email'    => $email,
                'currency' => 'NPR',
                'timezone' => 'Asia/Kathmandu',
            ]);

            $user = User::create([
                'name'          => $name,
                'email'         => $email,
                'password'      => Hash::make(Str::random(32)),
                'is_active'     => true,
                'firebase_uid'  => $uid,
                'restaurant_id' => $restaurant->id,
            ]);

            $user->assignRole('owner');
            $mailService->sendWelcomeEmail($user);
        }

        if ($user->is_active === false) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'        => $user->load('restaurant'),
            'token'       => $token,
            'is_new_user' => $isNewUser,
        ]);
    }
}
