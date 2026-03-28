<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['order.table', 'customer'])
            ->whereHas('order', fn($q) => $q->where('restaurant_id', $request->user()->restaurant_id));
        if ($request->method) $query->where('method', $request->method);
        if ($request->date) $query->whereDate('created_at', $request->date);
        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:cash,card,upi,online,due',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $order = Order::findOrFail($data['order_id']);
        abort_if($order->restaurant_id !== $request->user()->restaurant_id, 403);

        $payment = Payment::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
            'customer_id' => $order->customer_id,
            'status' => 'completed',
            'paid_at' => now(),
        ]));

        // Update order payment status atomically
        DB::transaction(function () use ($order) {
            $order->lockForUpdate();
            $totalPaid = $order->payments()->where('status', 'completed')->sum('amount');
            $paymentStatus = $totalPaid >= $order->total ? 'paid' : ($totalPaid > 0 ? 'partial' : 'unpaid');
            $order->update(['payment_status' => $paymentStatus]);
        });

        $businessMailService->sendPaymentReceived($payment, $order, $request->user()->restaurant);

        return response()->json($payment->load('order'), 201);
    }

    public function show(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);
        return response()->json($payment->load(['order', 'customer']));
    }

    public function update(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);
        $payment->update($request->validate(['notes' => 'nullable|string', 'status' => 'sometimes|in:pending,completed,failed,refunded']));
        return response()->json($payment->fresh());
    }

    public function destroy(Request $request, Payment $payment)
    {
        $this->authorizePayment($request, $payment);
        $payment->update(['status' => 'refunded']);
        return response()->json(['message' => 'Payment refunded.']);
    }

    public function duePayments(Request $request)
    {
        $data = Order::with(['customer', 'table'])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->where('payment_status', 'unpaid')
            ->where('status', 'completed')
            ->get();
        return response()->json($data);
    }

    private function authorizePayment(Request $request, Payment $payment): void
    {
        abort_if($payment->restaurant_id !== $request->user()->restaurant_id, 403);
    }
}
