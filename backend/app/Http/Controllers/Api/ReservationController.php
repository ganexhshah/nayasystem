<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $query = Reservation::with(['table', 'customer'])
            ->where('restaurant_id', $request->user()->restaurant_id);
        if ($request->date) $query->whereDate('reserved_at', $request->date);
        if ($request->status) $query->where('status', $request->status);
        return response()->json($query->orderBy('reserved_at')->paginate(20));
    }

    public function store(Request $request, string $slug = null)
    {
        $data = $request->validate([
            'table_id'        => 'nullable|exists:tables,id',
            'guest_name'      => 'required|string|max:255',
            'guest_phone'     => 'required|string|max:20',
            'guest_email'     => 'nullable|email',
            'party_size'      => 'required|integer|min:1|max:500',
            'reserved_at'     => 'required|date_format:Y-m-d H:i',
            'notes'           => 'nullable|string',
            'special_package' => 'nullable|string|max:255',
            'pre_order_items' => 'nullable|array',
            'package_price'   => 'nullable|numeric|min:0',
        ]);

        $restaurantId = $slug
            ? \App\Models\Restaurant::where('slug', $slug)->firstOrFail()->id
            : $request->user()->restaurant_id;

        $restaurant = \App\Models\Restaurant::findOrFail($restaurantId);
        
        // Convert reservation time from client timezone to UTC using restaurant timezone
        $reservedAt = Carbon::createFromFormat(
            'Y-m-d H:i',
            $data['reserved_at'],
            $restaurant->timezone ?? 'UTC'
        )->utc();

        if (!empty($data['table_id'])) {
            abort_if(
                !\App\Models\Table::where('id', $data['table_id'])
                    ->where('restaurant_id', $restaurantId)
                    ->exists(),
                403
            );
        }

        // Link to customer account if authenticated via Sanctum
        $customerId = null;
        try {
            $user = \Laravel\Sanctum\PersonalAccessToken::findToken(
                $request->bearerToken()
            )?->tokenable;
            if ($user instanceof \App\Models\Customer) {
                $customerId = $user->id;
            }
        } catch (\Throwable) {}

        $reservation = Reservation::create([
            ...$data,
            'reserved_at'   => $reservedAt,
            'restaurant_id' => $restaurantId,
            'customer_id'   => $customerId,
            'status'        => 'pending',
        ]);

        return response()->json($reservation, 201);
    }

    public function show(Request $request, Reservation $reservation)
    {
        abort_if($reservation->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($reservation->load(['table', 'customer']));
    }

    public function update(Request $request, Reservation $reservation)
    {
        abort_if($reservation->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'table_id'        => 'nullable|exists:tables,id',
            'party_size'      => 'sometimes|integer|min:1|max:500',
            'reserved_at'     => 'sometimes|date_format:Y-m-d H:i',
            'notes'           => 'nullable|string',
            'special_package' => 'nullable|string|max:255',
            'pre_order_items' => 'nullable|array',
            'package_price'   => 'nullable|numeric|min:0',
        ]);

        if (!empty($data['table_id'])) {
            abort_if(
                !\App\Models\Table::where('id', $data['table_id'])
                    ->where('restaurant_id', $reservation->restaurant_id)
                    ->exists(),
                403
            );
        }

        // Convert reservation time from client timezone to UTC if updating
        if (!empty($data['reserved_at'])) {
            $restaurant = $reservation->restaurant;
            $data['reserved_at'] = Carbon::createFromFormat(
                'Y-m-d H:i',
                $data['reserved_at'],
                $restaurant->timezone ?? 'UTC'
            )->utc();
        }

        $reservation->update($data);
        return response()->json($reservation->fresh());
    }

    public function destroy(Request $request, Reservation $reservation)
    {
        abort_if($reservation->restaurant_id !== $request->user()->restaurant_id, 403);
        $reservation->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function updateStatus(Request $request, Reservation $reservation)
    {
        abort_if($reservation->restaurant_id !== $request->user()->restaurant_id, 403);
        $request->validate(['status' => 'required|in:pending,confirmed,seated,completed,cancelled,no_show']);
        $reservation->update(['status' => $request->status]);
        return response()->json($reservation->fresh());
    }
}
