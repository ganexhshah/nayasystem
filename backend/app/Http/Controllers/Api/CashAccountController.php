<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Payment;
use Illuminate\Http\Request;

class CashAccountController extends Controller
{
    public function index(Request $request)
    {
        $restaurantId = $request->user()->restaurant_id;

        $cashPayments = Payment::query()
            ->with(['customer', 'order'])
            ->where('restaurant_id', $restaurantId)
            ->where('method', 'cash')
            ->where('status', 'completed')
            ->get()
            ->map(function (Payment $payment) {
                return [
                    'date' => optional($payment->paid_at ?? $payment->created_at)->toDateString(),
                    'particulars' => $payment->customer?->name ?: 'Cash Sale',
                    'txn' => $payment->reference ?: ($payment->order?->order_number ?: 'PAY-' . $payment->id),
                    'cash_in' => (float) $payment->amount,
                    'cash_out' => 0.0,
                    'sort_at' => optional($payment->paid_at ?? $payment->created_at)->timestamp ?? 0,
                    'source' => 'payment',
                ];
            });

        $expenses = Expense::query()
            ->where('restaurant_id', $restaurantId)
            ->get()
            ->map(function (Expense $expense) {
                return [
                    'date' => optional($expense->date)->toDateString(),
                    'particulars' => $expense->title,
                    'txn' => 'EXP-' . $expense->id,
                    'cash_in' => 0.0,
                    'cash_out' => (float) $expense->amount,
                    'sort_at' => optional($expense->date)->timestamp ?? optional($expense->created_at)->timestamp ?? 0,
                    'source' => 'expense',
                ];
            });

        $entries = $cashPayments
            ->concat($expenses)
            ->sortBy('sort_at')
            ->values();

        $runningBalance = 0.0;
        $ledger = $entries->map(function (array $entry) use (&$runningBalance) {
            $runningBalance += $entry['cash_in'] - $entry['cash_out'];

            return [
                'date' => $entry['date'],
                'particulars' => $entry['particulars'],
                'txn' => $entry['txn'],
                'cash_in' => round($entry['cash_in'], 2),
                'cash_out' => round($entry['cash_out'], 2),
                'balance' => round($runningBalance, 2),
                'source' => $entry['source'],
            ];
        })->reverse()->values();

        return response()->json([
            'balance' => round($runningBalance, 2),
            'entries' => $ledger,
        ]);
    }
}
