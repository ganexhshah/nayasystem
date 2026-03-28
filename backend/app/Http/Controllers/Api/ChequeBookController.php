<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\ChequeBook;
use Illuminate\Http\Request;

class ChequeBookController extends Controller
{
    public function index(Request $request)
    {
        $query = ChequeBook::query()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->withCount([
                'cheques as assigned_count',
                'cheques as cashed_count' => fn($builder) => $builder->where('status', 'cashed'),
                'cheques as void_count' => fn($builder) => $builder->where('status', 'void'),
            ]);

        $bankName = trim((string) $request->query('bank_name', ''));
        if ($bankName !== '') {
            $query->where('bank_name', 'like', '%' . $bankName . '%');
        }

        $chequeBooks = $query->latest()->get()->map(function (ChequeBook $chequeBook) {
            $chequeBook->series = $chequeBook->cheque_from . ' - ' . $chequeBook->cheque_to;
            $chequeBook->unassigned_count = max($chequeBook->total_cheques - $chequeBook->assigned_count, 0);

            return $chequeBook;
        });

        return response()->json($chequeBooks);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'bank_name' => 'required|string|max:255',
            'cheque_from' => ['required', 'string', 'max:100', 'regex:/^[0-9]+$/'],
            'cheque_to' => ['required', 'string', 'max:100', 'regex:/^[0-9]+$/'],
        ]);

        $from = (int) $payload['cheque_from'];
        $to = (int) $payload['cheque_to'];
        abort_if($to < $from, 422, 'Cheque To must be greater than or equal to Cheque From.');

        $bankAccount = BankAccount::query()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->where('bank_name', $payload['bank_name'])
            ->first();

        $chequeBook = ChequeBook::create([
            ...$payload,
            'restaurant_id' => $request->user()->restaurant_id,
            'bank_account_id' => $bankAccount?->id,
            'user_id' => $request->user()->id,
            'total_cheques' => ($to - $from) + 1,
        ]);

        $chequeBook->assigned_count = 0;
        $chequeBook->cashed_count = 0;
        $chequeBook->void_count = 0;
        $chequeBook->unassigned_count = $chequeBook->total_cheques;
        $chequeBook->series = $chequeBook->cheque_from . ' - ' . $chequeBook->cheque_to;

        return response()->json($chequeBook, 201);
    }

    public function show(Request $request, ChequeBook $chequeBook)
    {
        $this->authorizeRestaurant($request, $chequeBook);

        $chequeBook->load('cheques');
        $chequeBook->assigned_count = $chequeBook->cheques->count();
        $chequeBook->cashed_count = $chequeBook->cheques->where('status', 'cashed')->count();
        $chequeBook->void_count = $chequeBook->cheques->where('status', 'void')->count();
        $chequeBook->unassigned_count = max($chequeBook->total_cheques - $chequeBook->assigned_count, 0);
        $chequeBook->series = $chequeBook->cheque_from . ' - ' . $chequeBook->cheque_to;

        return response()->json($chequeBook);
    }

    public function destroy(Request $request, ChequeBook $chequeBook)
    {
        $this->authorizeRestaurant($request, $chequeBook);
        $chequeBook->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function authorizeRestaurant(Request $request, ChequeBook $chequeBook): void
    {
        abort_if($chequeBook->restaurant_id !== $request->user()->restaurant_id, 403);
    }
}
