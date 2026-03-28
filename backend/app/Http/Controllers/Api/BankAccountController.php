<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BankAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = BankAccount::query()
            ->where('restaurant_id', $request->user()->restaurant_id);

        $search = trim((string) $request->query('search', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('bank_name', 'like', '%' . $search . '%')
                    ->orWhere('account_name', 'like', '%' . $search . '%')
                    ->orWhere('account_number', 'like', '%' . $search . '%')
                    ->orWhere('branch_address', 'like', '%' . $search . '%');
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_type' => 'required|string|max:100',
            'swift_code' => 'nullable|string|max:100',
            'branch_address' => 'nullable|string|max:255',
            'opening_date_bs' => 'nullable|string|max:50',
            'opening_date_ad' => 'nullable|date',
            'logo' => 'nullable|image|max:4096',
        ]);

        $openingBalance = $this->normalizeAmount($request->input('opening_balance', 0));

        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $logoUrl = $this->storeLogo($request->file('logo'));
        }

        $bankAccount = BankAccount::create([
            ...$payload,
            'restaurant_id' => $request->user()->restaurant_id,
            'user_id' => $request->user()->id,
            'opening_balance' => $openingBalance,
            'current_balance' => $openingBalance,
            'opening_date_bs' => $this->nullableString($request->input('opening_date_bs')),
            'opening_date_ad' => $this->nullableString($request->input('opening_date_ad')),
            'logo' => $logoUrl,
        ]);

        return response()->json($bankAccount, 201);
    }

    public function show(Request $request, BankAccount $bankAccount)
    {
        $this->authorizeRestaurant($request, $bankAccount);

        return response()->json($bankAccount);
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $this->authorizeRestaurant($request, $bankAccount);

        $payload = $request->validate([
            'bank_name' => 'sometimes|string|max:255',
            'account_name' => 'sometimes|string|max:255',
            'account_number' => 'sometimes|string|max:255',
            'account_type' => 'sometimes|string|max:100',
            'swift_code' => 'nullable|string|max:100',
            'branch_address' => 'nullable|string|max:255',
            'opening_date_bs' => 'nullable|string|max:50',
            'opening_date_ad' => 'nullable|date',
            'logo' => 'nullable|image|max:4096',
        ]);

        if ($request->has('opening_balance')) {
            $openingBalance = $this->normalizeAmount($request->input('opening_balance', 0));
            $difference = $openingBalance - (float) $bankAccount->opening_balance;

            $payload['opening_balance'] = $openingBalance;
            $payload['current_balance'] = (float) $bankAccount->current_balance + $difference;
        }

        if ($request->hasFile('logo')) {
            $payload['logo'] = $this->storeLogo($request->file('logo'));
        }

        if ($request->exists('opening_date_bs')) {
            $payload['opening_date_bs'] = $this->nullableString($request->input('opening_date_bs'));
        }

        if ($request->exists('opening_date_ad')) {
            $payload['opening_date_ad'] = $this->nullableString($request->input('opening_date_ad'));
        }

        $bankAccount->update($payload);

        return response()->json($bankAccount->fresh());
    }

    public function destroy(Request $request, BankAccount $bankAccount)
    {
        $this->authorizeRestaurant($request, $bankAccount);
        $bankAccount->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function authorizeRestaurant(Request $request, BankAccount $bankAccount): void
    {
        abort_if($bankAccount->restaurant_id !== $request->user()->restaurant_id, 403);
    }

    private function storeLogo(UploadedFile $file): string
    {
        $disk = Storage::disk($this->resolveUploadDisk());
        $path = $disk->put('bank-logos', $file);

        return $disk->url($path);
    }

    private function resolveUploadDisk(): string
    {
        $default = (string) config('filesystems.default', 'public');
        $s3Bucket = (string) config('filesystems.disks.s3.bucket', '');

        if ($default === 's3' && $s3Bucket === '') {
            return 'public';
        }

        return $default;
    }

    private function normalizeAmount(mixed $value): float
    {
        $normalized = str_replace([',', ' '], '', (string) $value);

        if ($normalized === '' || !is_numeric($normalized)) {
            throw ValidationException::withMessages([
                'opening_balance' => ['The opening balance must be a valid number.'],
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
