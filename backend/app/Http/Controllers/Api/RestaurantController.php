<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function publicIndex(Request $request)
    {
        $restaurants = Restaurant::query()
            ->where('is_active', true)
            ->withCount([
                'menuItems as menu_items_count',
                'orders as total_ratings' => fn ($query) => $query->whereNotNull('rating'),
            ])
            ->withAvg([
                'orders as avg_rating' => fn ($query) => $query->whereNotNull('rating'),
            ], 'rating')
            ->orderBy('name')
            ->get([
                'id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'country',
                'logo', 'currency', 'timezone', 'tax_rate', 'service_charge', 'settings',
            ]);

        return response()->json($restaurants->map(function (Restaurant $restaurant) {
            $settings = $restaurant->settings ?? [];

            return [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'email' => $restaurant->email,
                'phone' => $restaurant->phone,
                'address' => $restaurant->address,
                'city' => $restaurant->city,
                'country' => $restaurant->country,
                'logo' => $restaurant->logo,
                'currency' => $restaurant->currency,
                'timezone' => $restaurant->timezone,
                'tax_rate' => $restaurant->tax_rate,
                'service_charge' => $restaurant->service_charge,
                'settings' => $settings,
                'tagline' => $settings['tagline'] ?? null,
                'cuisine_type' => $settings['cuisine_type'] ?? null,
                'avg_rating' => $restaurant->avg_rating !== null ? round((float) $restaurant->avg_rating, 1) : null,
                'total_ratings' => (int) ($restaurant->total_ratings ?? 0),
                'menu_items_count' => (int) ($restaurant->menu_items_count ?? 0),
            ];
        })->values());
    }

    public function publicShow(Request $request, string $slug)
    {
        $restaurant = Restaurant::where('slug', $slug)->where('is_active', true)->firstOrFail();
        return response()->json($restaurant->only([
            'id', 'name', 'slug', 'email', 'phone', 'address', 'city', 'country',
            'logo', 'currency', 'timezone', 'tax_rate', 'service_charge', 'settings',
        ]));
    }
}
