<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use App\Support\GoogleIdentityVerifier;

class CustomerAuthController extends Controller
{
    private function restaurant(string $slug): Restaurant
    {
        return Restaurant::where('slug', $slug)->firstOrFail();
    }

    public function register(Request $request, string $slug)
    {
        $restaurant = $this->restaurant($slug);

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email',
            'phone'    => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (Customer::where('restaurant_id', $restaurant->id)->whereRaw('LOWER(email) = ?', [Str::lower($data['email'])])->exists()) {
            return response()->json(['message' => 'Email already registered.'], 422);
        }

        $customer = Customer::create([
            'restaurant_id' => $restaurant->id,
            'name'          => $data['name'],
            'email'         => $data['email'],
            'phone'         => $data['phone'] ?? null,
            'password'      => Hash::make($data['password']),
        ]);

        $token = $customer->createToken('customer_token')->plainTextToken;
        return response()->json(['customer' => $customer, 'token' => $token], 201);
    }

    public function login(Request $request, string $slug)
    {
        $restaurant = $this->restaurant($slug);

        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $customer = Customer::where('restaurant_id', $restaurant->id)
            ->whereRaw('LOWER(email) = ?', [Str::lower($data['email'])])
            ->first();

        if (!$customer || !Hash::check($data['password'], $customer->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $customer->createToken('customer_token')->plainTextToken;
        return response()->json(['customer' => $customer, 'token' => $token]);
    }

    public function googleAuth(Request $request, string $slug, FirebaseAuth $auth, GoogleIdentityVerifier $googleIdentityVerifier)
    {
        $restaurant = $this->restaurant($slug);
        $request->validate(['id_token' => 'required|string']);

        try {
            $identity = $googleIdentityVerifier->verify($request->id_token, $auth);
        } catch (\Throwable $e) {
            Log::warning('Customer Google auth token verification failed', ['error' => $e->getMessage(), 'restaurant_slug' => $slug]);
            return response()->json(['message' => 'Invalid token.'], 401);
        }

        $uid = $identity['uid'];
        $email = $identity['email'];
        $name = $identity['name'] ?? explode('@', $email)[0];
        $photo = $identity['picture'] ?? null;

        $customer = Customer::where('restaurant_id', $restaurant->id)
            ->whereRaw('LOWER(email) = ?', [Str::lower($email)])
            ->first();

        if (!$customer) {
            $customer = Customer::create([
                'restaurant_id' => $restaurant->id,
                'name'          => $name,
                'email'         => $email,
                'firebase_uid'  => $uid,
                'avatar'        => $photo,
                'password'      => Hash::make(Str::random(32)),
            ]);
        } else {
            $customer->update(['firebase_uid' => $uid, 'avatar' => $photo ?? $customer->avatar]);
        }

        $token = $customer->createToken('customer_token')->plainTextToken;
        return response()->json(['customer' => $customer, 'token' => $token]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $customer = $request->user();
        $data = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'phone'           => 'nullable|string|max:20',
            'address'         => 'nullable|string',
            'saved_addresses' => 'nullable|array',
        ]);
        $customer->update($data);
        return response()->json($customer->fresh());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function orders(Request $request)
    {
        $orders = $request->user()
            ->orders()
            ->with('items')
            ->latest()
            ->get();

        $reservations = $request->user()
            ->reservations()
            ->latest()
            ->get();

        return response()->json([
            'orders'       => $orders,
            'reservations' => $reservations,
        ]);
    }
}
