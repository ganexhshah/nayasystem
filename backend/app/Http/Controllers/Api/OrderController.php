<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Kot;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Table;
use App\Models\User;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    private function restaurantId(Request $request): int
    {
        return $request->user()->restaurant_id;
    }

    public function index(Request $request)
    {
        $perPage = min((int)$request->input('per_page', 20), 100);
        
        $query = Order::with(['table', 'customer', 'items', 'payments'])
            ->where('restaurant_id', $this->restaurantId($request));

        if ($request->filled('status') && in_array($request->status, ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])) {
            $query->where('status', $request->status);
        }
        if ($request->filled('order_type') && in_array($request->order_type, ['dine_in', 'takeaway', 'delivery', 'online'])) {
            $query->where('order_type', $request->order_type);
        }
        if ($request->filled('date') && strtotime($request->date)) {
            $query->whereDate('created_at', $request->date);
        }

        return response()->json($query->latest()->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'table_id' => 'nullable|integer|exists:tables,id',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'order_type' => 'required|in:dine_in,takeaway,delivery,online',
            'items' => 'required|array|min:1|max:100',
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:500',
            'items.*.modifiers' => 'nullable|array|max:20',
            'items.*.modifiers.*.id' => 'integer',
            'items.*.modifiers.*.price' => 'numeric|min:0|max:10000',
            'items.*.notes' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Use database transaction to ensure data integrity
        try {
            return response()->json(DB::transaction(function () use ($request, $data) {
                return $this->createOrderTransaction($request, $data);
            }), 201);
        } catch (\Exception $e) {
            Log::error('Order creation failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create order. Please try again.'], 500);
        }
    }

    private function createOrderTransaction(Request $request, array $data): Order
    {
        $restaurantId = $this->restaurantId($request);
        $tableId = null;
        $customerId = null;

        if (!empty($data['table_id'])) {
            $tableId = Table::where('id', $data['table_id'])
                ->where('restaurant_id', $restaurantId)
                ->value('id');
            abort_if(!$tableId, 403);
        }

        if (!empty($data['customer_id'])) {
            $customerId = Customer::where('id', $data['customer_id'])
                ->where('restaurant_id', $restaurantId)
                ->value('id');
            abort_if(!$customerId, 403);
        }

        $menuItemIds = collect($data['items'])->pluck('menu_item_id')->unique()->values();
        $menuItems = MenuItem::whereIn('id', $menuItemIds)
            ->where('restaurant_id', $restaurantId)
            ->get()
            ->keyBy('id');
        abort_if($menuItems->count() !== $menuItemIds->count(), 403);

        $subtotal = 0;

        $order = Order::create([
            'restaurant_id' => $restaurantId,
            'table_id' => $tableId,
            'customer_id' => $customerId,
            'user_id' => $request->user()->id,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'order_type' => $data['order_type'],
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 0,
            'tax' => 0,
            'service_charge' => 0,
            'discount' => 0,
            'total' => 0,
            'notes' => $data['notes'] ?? null,
            'delivery_address' => $data['delivery_address'] ?? null,
        ]);

        foreach ($data['items'] as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);
            $modifierTotal = collect($item['modifiers'] ?? [])->sum('price');
            $linePrice = ($menuItem->price + $modifierTotal) * $item['quantity'];
            $subtotal += $linePrice;

            OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'price' => $menuItem->price + $modifierTotal,
                'quantity' => $item['quantity'],
                'modifiers' => $item['modifiers'] ?? [],
                'notes' => $item['notes'] ?? null,
                'status' => 'pending',
            ]);
        }

        $restaurant = $request->user()->restaurant;
        $tax = $subtotal * ($restaurant->tax_rate / 100);
        $serviceCharge = $subtotal * ($restaurant->service_charge / 100);
        $total = $subtotal + $tax + $serviceCharge;

        $order->update([
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'total' => $total,
        ]);

        return $order->load(['items', 'table', 'customer']);
    }

    public function posStore(Request $request)
    {
        return $this->store($request);
    }

    /**
     * Add new items to an existing order and create a new KOT for them.
     */
    public function addItems(Request $request, Order $order)
    {
        abort_if($order->restaurant_id !== $this->restaurantId($request), 403);
        abort_if($order->payment_status === 'paid', 422, 'Cannot add items to a paid order.');

        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $restaurantId = $this->restaurantId($request);
        $menuItemIds = collect($data['items'])->pluck('menu_item_id')->unique()->values();
        $menuItems = MenuItem::whereIn('id', $menuItemIds)
            ->where('restaurant_id', $restaurantId)
            ->get()
            ->keyBy('id');
        abort_if($menuItems->count() !== $menuItemIds->count(), 403);

        // Create a new KOT for these additional items
        $kot = Kot::create([
            'restaurant_id' => $restaurantId,
            'order_id' => $order->id,
            'kot_number' => 'KOT-' . strtoupper(Str::random(6)),
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        $addedSubtotal = 0;
        foreach ($data['items'] as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);
            $linePrice = $menuItem->price * $item['quantity'];
            $addedSubtotal += $linePrice;

            OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'price' => $menuItem->price,
                'quantity' => $item['quantity'],
                'notes' => $item['notes'] ?? null,
                'status' => 'pending',
            ]);
        }

        // Recalculate order totals
        $restaurant = $request->user()->restaurant;
        $newSubtotal = $order->subtotal + $addedSubtotal;
        $tax = $newSubtotal * ($restaurant->tax_rate / 100);
        $serviceCharge = $newSubtotal * ($restaurant->service_charge / 100);
        $total = $newSubtotal + $tax + $serviceCharge - $order->discount;

        $order->update([
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'total' => $total,
        ]);

        return response()->json($order->fresh()->load(['items', 'table', 'customer', 'kots']), 200);
    }

    public function publicOrderStatus(Request $request, int $id)
    {
        $order = \App\Models\Order::findOrFail($id);
        if (!$this->isValidPublicToken($order, $request->query('token'))) {
            return response()->json(['message' => 'Unauthorized tracking token.'], 403);
        }
        return response()->json([
            'status'         => $order->status,
            'payment_status' => $order->payment_status,
            'order_number'   => $order->order_number,
            'rating'         => $order->rating,
            'review'         => $order->review,
        ]);
    }

    public function publicRatings(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 24), 1), 100);

        $ratings = Order::with([
                'restaurant:id,name,slug,logo',
                'customer:id,name',
            ])
            ->whereNotNull('rating')
            ->where(function ($query) {
                $query->whereNotNull('review')
                    ->orWhere('rating', '>=', 1);
            })
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json($ratings->map(fn (Order $order) => $this->transformPublicRating($order))->values());
    }

    public function restaurantRatings(Request $request, string $slug)
    {
        $limit = min(max((int) $request->query('limit', 12), 1), 100);

        $restaurant = \App\Models\Restaurant::where('slug', $slug)->firstOrFail();

        $ratingsQuery = Order::with([
                'restaurant:id,name,slug,logo',
                'customer:id,name',
            ])
            ->where('restaurant_id', $restaurant->id)
            ->whereNotNull('rating')
            ->where(function ($query) {
                $query->whereNotNull('review')
                    ->orWhere('rating', '>=', 1);
            });

        $ratings = (clone $ratingsQuery)
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json([
            'ratings' => $ratings->map(fn (Order $order) => $this->transformPublicRating($order))->values(),
            'summary' => [
                'average_rating' => round((float) ((clone $ratingsQuery)->avg('rating') ?? 0), 1),
                'total_ratings' => (clone $ratingsQuery)->count(),
            ],
        ]);
    }

    public function rateOrder(Request $request, int $id)
    {
        $order = \App\Models\Order::findOrFail($id);
        if (!$this->isValidPublicToken($order, $request->input('token'))) {
            return response()->json(['message' => 'Unauthorized tracking token.'], 403);
        }
        $data  = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:500',
        ]);
        if (!in_array($order->status, ['served', 'completed'], true)) {
            return response()->json(['message' => 'Order is not completed yet.'], 422);
        }
        if ($order->rating !== null) {
            return response()->json(['message' => 'Rating already submitted.'], 409);
        }
        $order->update($data);
        return response()->json(['message' => 'Thank you for your feedback!']);
    }

    public function publicStore(Request $request, string $slug)
    {
        // 1.1 Look up restaurant by slug; return 404 if not found
        $restaurant = \App\Models\Restaurant::where('slug', $slug)->first();
        if (!$restaurant) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        // 1.2 Validate request
        $data = $request->validate([
            'order_type' => 'required|in:dine_in,takeaway,delivery',
            'items'      => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.notes'        => 'nullable|string',
            'table_id'   => 'required_if:order_type,dine_in|nullable|integer',
            'notes'      => 'nullable|string',
        ]);

        // 1.3 Validate all menu_item_id values belong to the restaurant
        $menuItemIds = collect($data['items'])->pluck('menu_item_id')->unique()->values();
        $validMenuItems = \App\Models\MenuItem::whereIn('id', $menuItemIds)
            ->where('restaurant_id', $restaurant->id)
            ->get()
            ->keyBy('id');

        foreach ($menuItemIds as $index => $menuItemId) {
            if (!$validMenuItems->has($menuItemId)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => [
                        "items.{$index}.menu_item_id" => ['The selected menu item is invalid.'],
                    ],
                ], 422);
            }
        }

        // 1.4 Validate table_id belongs to the restaurant when provided
        if (!empty($data['table_id'])) {
            $table = \App\Models\Table::where('id', $data['table_id'])
                ->where('restaurant_id', $restaurant->id)
                ->first();
            if (!$table) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors'  => ['table_id' => ['The selected table is invalid.']],
                ], 422);
            }
        }

        // 1.5 Create Order record
        // Optionally link customer if Bearer token provided
        $customerId = null;
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($pat && $pat->tokenable_type === \App\Models\Customer::class) {
                $customerId = $pat->tokenable_id;
            }
        }

        $order = Order::create([
            'restaurant_id'  => $restaurant->id,
            'table_id'       => $data['table_id'] ?? null,
            'customer_id'    => $customerId,
            'user_id'        => null,
            'order_number'   => 'ORD-' . strtoupper(Str::random(8)),
            'order_type'     => $data['order_type'],
            'status'         => 'pending',
            'payment_status' => 'unpaid',
            'subtotal'       => 0,
            'tax'            => 0,
            'service_charge' => 0,
            'total'          => 0,
            'notes'          => $data['notes'] ?? null,
        ]);

        // 1.6 Create OrderItem records (snapshot name/price from MenuItem)
        $subtotal = 0;
        $orderItems = [];

        foreach ($data['items'] as $item) {
            $menuItem = $validMenuItems->get($item['menu_item_id']);
            $linePrice = $menuItem->price * $item['quantity'];
            $subtotal += $linePrice;

            $orderItems[] = OrderItem::create([
                'order_id'     => $order->id,
                'menu_item_id' => $menuItem->id,
                'name'         => $menuItem->name,
                'price'        => $menuItem->price,
                'quantity'     => $item['quantity'],
                'notes'        => $item['notes'] ?? null,
            ]);
        }

        // 1.7 Calculate and persist subtotal, tax, service_charge, total
        $tax           = $subtotal * ($restaurant->tax_rate / 100);
        $serviceCharge = $subtotal * ($restaurant->service_charge / 100);
        $total         = $subtotal + $tax + $serviceCharge;

        $order->update([
            'subtotal'       => $subtotal,
            'tax'            => $tax,
            'service_charge' => $serviceCharge,
            'total'          => $total,
        ]);

        // 1.8 Create one Kot record; assign kitchen_id if a Kitchen exists
        $kitchen = \App\Models\Kitchen::where('restaurant_id', $restaurant->id)->first();

        $kot = Kot::create([
            'restaurant_id' => $restaurant->id,
            'order_id'      => $order->id,
            'kitchen_id'    => $kitchen?->id,
            'kot_number'    => 'KOT-' . strtoupper(Str::random(8)),
            'status'        => 'pending',
        ]);

        // 1.9 Set kot_id on all created OrderItem records
        foreach ($orderItems as $orderItem) {
            $orderItem->update(['kot_id' => $kot->id]);
        }

        // 1.10 Return response with HTTP 201
        return response()->json([
            'id'             => $order->id,
            'order_number'   => $order->order_number,
            'tracking_token' => $this->publicToken($order),
            'total'          => $order->total,
            'status'         => $order->status,
            'payment_status' => $order->payment_status,
        ], 201);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        return response()->json($order->load(['items.menuItem', 'table', 'customer', 'kots', 'payments', 'user']));
    }

    public function update(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        $order->update($request->only(['notes', 'discount', 'delivery_address', 'delivery_fee']));
        return response()->json($order->fresh());
    }

    public function destroy(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        $order->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Order cancelled.']);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        $request->validate(['status' => 'required|in:pending,confirmed,preparing,ready,served,completed,cancelled']);
        $order->update(['status' => $request->status]);
        return response()->json($order->fresh());
    }

    public function assignWaiter(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        $request->validate(['user_id' => 'nullable|exists:users,id']);

        $waiterId = null;
        if (!empty($request->user_id)) {
            $waiterId = User::where('id', $request->user_id)
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->value('id');
            abort_if(!$waiterId, 403);
        }

        $order->update(['user_id' => $waiterId, 'waiter_acceptance' => 'pending']);
        return response()->json($order->load(['table', 'customer', 'user', 'items', 'payments']));
    }

    public function updateWaiterAcceptance(Request $request, Order $order)
    {
        $this->authorizeRestaurant($request, $order);
        $request->validate(['waiter_acceptance' => 'required|in:pending,accepted,declined']);
        $order->update(['waiter_acceptance' => $request->waiter_acceptance]);
        return response()->json($order->fresh());
    }

    public function generateInvoice(Request $request, Order $order, BusinessMailService $businessMailService)
    {
        $this->authorizeRestaurant($request, $order);
        $order->load(['items.menuItem', 'table', 'customer', 'payments']);
        $restaurant = $request->user()->restaurant;

        $pdf = Pdf::loadView('invoices.order', compact('order', 'restaurant'));
        $filename = "invoice-{$order->order_number}.pdf";

        $businessMailService->sendInvoiceGenerated($order, $restaurant, $pdf->output(), $filename);

        return $pdf->download($filename);
    }

    private function authorizeRestaurant(Request $request, Order $order): void
    {
        abort_if($order->restaurant_id !== $this->restaurantId($request), 403);
    }

    private function publicToken(Order $order): string
    {
        return hash_hmac('sha256', 'public-order:'.$order->id, (string) config('app.key'));
    }

    private function isValidPublicToken(Order $order, ?string $token): bool
    {
        if (!$token) {
            return false;
        }
        return hash_equals($this->publicToken($order), $token);
    }

    private function transformPublicRating(Order $order): array
    {
        $reviewerName = trim((string) optional($order->customer)->name);

        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'rating' => $order->rating,
            'review' => $order->review,
            'created_at' => optional($order->created_at)->toISOString(),
            'reviewer_name' => $reviewerName !== '' ? $reviewerName : 'Guest Customer',
            'reviewer_type' => $reviewerName !== '' ? 'customer' : 'guest',
            'restaurant' => [
                'id' => $order->restaurant?->id,
                'name' => $order->restaurant?->name,
                'slug' => $order->restaurant?->slug,
                'logo' => $order->restaurant?->logo,
            ],
        ];
    }
}
