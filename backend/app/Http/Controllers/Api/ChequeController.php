<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Cheque;
use App\Models\ChequeBook;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChequeController extends Controller
{
    public function index(Request $request)
    {
        $query = Cheque::query()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->latest();

        if ($type = $this->nullableString($request->query('type'))) {
            $query->where('type', $type);
        }

        if ($status = $this->nullableString($request->query('status'))) {
            $query->where('status', $status);
        }

        if ($bankName = $this->nullableString($request->query('bank_name'))) {
            $query->where('bank_name', 'like', '%' . $bankName . '%');
        }

        if ($chequeNo = $this->nullableString($request->query('cheque_no'))) {
            $query->where('cheque_no', 'like', '%' . $chequeNo . '%');
        }

        if ($partyName = $this->nullableString($request->query('party_name'))) {
            $query->where('party_name', 'like', '%' . $partyName . '%');
        }

        if ($from = $this->nullableString($request->query('from_ad'))) {
            $query->whereDate('entry_date_ad', '>=', $from);
        }

        if ($to = $this->nullableString($request->query('to_ad'))) {
            $query->whereDate('entry_date_ad', '<=', $to);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'type' => 'required|string|in:payment,received',
            'bank_name' => 'required|string|max:255',
            'cheque_no' => 'required|string|max:100',
            'entry_date_bs' => 'nullable|string|max:50',
            'entry_date_ad' => 'nullable|date',
            'transaction_date_bs' => 'nullable|string|max:50',
            'transaction_date_ad' => 'nullable|date',
            'party_type' => 'nullable|string|max:50',
            'party_name' => 'required|string|max:255',
            'voucher_no' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
        ]);

        $amount = $this->normalizeAmount($request->input('amount'));
        $bankAccount = $this->resolveBankAccount($request, $payload['bank_name']);
        $chequeBook = $this->resolveChequeBook($request, $payload['bank_name'], $payload['cheque_no']);

        $cheque = Cheque::create([
            ...$payload,
            'restaurant_id' => $request->user()->restaurant_id,
            'bank_account_id' => $bankAccount?->id,
            'cheque_book_id' => $chequeBook?->id,
            'user_id' => $request->user()->id,
            'entry_date_bs' => $this->nullableString($request->input('entry_date_bs')),
            'entry_date_ad' => $this->nullableString($request->input('entry_date_ad')),
            'transaction_date_bs' => $this->nullableString($request->input('transaction_date_bs')),
            'transaction_date_ad' => $this->nullableString($request->input('transaction_date_ad')),
            'party_type' => $this->nullableString($request->input('party_type')),
            'voucher_no' => $this->nullableString($request->input('voucher_no')),
            'status' => $payload['status'] ?? ($payload['type'] === 'received' ? 'received' : 'issued'),
            'amount' => $amount,
        ]);

        $this->applyBalanceDelta($bankAccount, $payload['type'], $amount);

        return response()->json($cheque, 201);
    }

    public function show(Request $request, Cheque $cheque)
    {
        $this->authorizeRestaurant($request, $cheque);

        return response()->json($cheque);
    }

    public function update(Request $request, Cheque $cheque)
    {
        $this->authorizeRestaurant($request, $cheque);

        $payload = $request->validate([
            'type' => 'sometimes|string|in:payment,received',
            'bank_name' => 'sometimes|string|max:255',
            'cheque_no' => 'sometimes|string|max:100',
            'entry_date_bs' => 'nullable|string|max:50',
            'entry_date_ad' => 'nullable|date',
            'transaction_date_bs' => 'nullable|string|max:50',
            'transaction_date_ad' => 'nullable|date',
            'party_type' => 'nullable|string|max:50',
            'party_name' => 'sometimes|string|max:255',
            'voucher_no' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'remarks' => 'nullable|string',
        ]);

        $oldBankAccount = $cheque->bankAccount;
        $oldAmount = (float) $cheque->amount;
        $oldType = $cheque->type;

        $this->applyBalanceDelta($oldBankAccount, $oldType, -$oldAmount);

        $newType = $payload['type'] ?? $cheque->type;
        $newBankName = $payload['bank_name'] ?? $cheque->bank_name;
        $newChequeNo = $payload['cheque_no'] ?? $cheque->cheque_no;
        $newAmount = $request->has('amount')
            ? $this->normalizeAmount($request->input('amount'))
            : $oldAmount;

        $newBankAccount = $this->resolveBankAccount($request, $newBankName);
        $newChequeBook = $this->resolveChequeBook($request, $newBankName, $newChequeNo);

        $payload['bank_account_id'] = $newBankAccount?->id;
        $payload['cheque_book_id'] = $newChequeBook?->id;

        if ($request->exists('entry_date_bs')) {
            $payload['entry_date_bs'] = $this->nullableString($request->input('entry_date_bs'));
        }

        if ($request->exists('entry_date_ad')) {
            $payload['entry_date_ad'] = $this->nullableString($request->input('entry_date_ad'));
        }

        if ($request->exists('transaction_date_bs')) {
            $payload['transaction_date_bs'] = $this->nullableString($request->input('transaction_date_bs'));
        }

        if ($request->exists('transaction_date_ad')) {
            $payload['transaction_date_ad'] = $this->nullableString($request->input('transaction_date_ad'));
        }

        if ($request->exists('party_type')) {
            $payload['party_type'] = $this->nullableString($request->input('party_type'));
        }

        if ($request->exists('voucher_no')) {
            $payload['voucher_no'] = $this->nullableString($request->input('voucher_no'));
        }

        if ($request->has('amount')) {
            $payload['amount'] = $newAmount;
        }

        $cheque->update($payload);
        $this->applyBalanceDelta($newBankAccount, $newType, $newAmount);

        return response()->json($cheque->fresh());
    }

    public function destroy(Request $request, Cheque $cheque)
    {
        $this->authorizeRestaurant($request, $cheque);
        $this->applyBalanceDelta($cheque->bankAccount, $cheque->type, -(float) $cheque->amount);
        $cheque->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function authorizeRestaurant(Request $request, Cheque $cheque): void
    {
        abort_if($cheque->restaurant_id !== $request->user()->restaurant_id, 403);
    }

    private function resolveBankAccount(Request $request, string $bankName): ?BankAccount
    {
        return BankAccount::query()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->where('bank_name', $bankName)
            ->first();
    }

    private function resolveChequeBook(Request $request, string $bankName, string $chequeNo): ?ChequeBook
    {
        $books = ChequeBook::query()
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->where('bank_name', $bankName)
            ->get();

        $numericChequeNo = ctype_digit($chequeNo) ? (int) $chequeNo : null;
        if ($numericChequeNo === null) {
            return null;
        }

        return $books->first(function (ChequeBook $chequeBook) use ($numericChequeNo) {
            if (!ctype_digit($chequeBook->cheque_from) || !ctype_digit($chequeBook->cheque_to)) {
                return false;
            }

            return $numericChequeNo >= (int) $chequeBook->cheque_from
                && $numericChequeNo <= (int) $chequeBook->cheque_to;
        });
    }

    private function applyBalanceDelta(?BankAccount $bankAccount, string $type, float $amount): void
    {
        if (!$bankAccount || $amount === 0.0) {
            return;
        }

        $delta = $type === 'received' ? $amount : -$amount;
        $bankAccount->current_balance = round((float) $bankAccount->current_balance + $delta, 2);
        $bankAccount->save();
    }

    private function normalizeAmount(mixed $value): float
    {
        $normalized = str_replace([',', ' '], '', (string) $value);

        if ($normalized === '' || !is_numeric($normalized)) {
            throw ValidationException::withMessages([
                'amount' => ['The amount must be a valid number.'],
            ]);
        }

        return round((float) $normalized, 2);
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
