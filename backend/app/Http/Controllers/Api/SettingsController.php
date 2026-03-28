<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BusinessMailService;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->restaurant);
    }

    public function update(Request $request, BusinessMailService $businessMailService)
    {
        $restaurant = $request->user()->restaurant;
        $oldBranches = collect(data_get($restaurant->settings, 'branches', []));

        $payload = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'country' => 'nullable|string',
            'currency' => 'nullable|string|max:10',
            'timezone' => 'nullable|string',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'service_charge' => 'nullable|numeric|min:0|max:100',
            'settings' => 'nullable|array',
        ]);

        $restaurant->update($payload);
        $freshRestaurant = $restaurant->fresh();

        if (is_array(data_get($payload, 'settings.branches'))) {
            $newBranches = collect(data_get($freshRestaurant->settings, 'branches', []));
            $oldIds = $oldBranches->pluck('id')->filter()->map(fn($id) => (string) $id)->all();

            $newBranches->each(function ($branch) use ($oldIds, $oldBranches, $businessMailService, $freshRestaurant) {
                $id = isset($branch['id']) ? (string) $branch['id'] : null;
                $name = trim((string) ($branch['name'] ?? ''));
                if ($name === '') {
                    return;
                }

                $isAdded = $id
                    ? !in_array($id, $oldIds, true)
                    : !$oldBranches->contains(fn($old) => ($old['name'] ?? null) === $name);

                if ($isAdded) {
                    $businessMailService->sendBranchAdded($freshRestaurant, $name);
                }
            });
        }

        return response()->json($freshRestaurant);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate(['logo' => ['required', new \App\Rules\ValidateImageFile()]]);
        $restaurant = $request->user()->restaurant;

        try {
            $url = $this->storeImageWithFallback(
                $request->file('logo'),
                'logos',
                (string) $restaurant->id,
                400
            );

            $restaurant->update(['logo' => $url]);
            return response()->json(['logo' => $url]);
        } catch (\Throwable $e) {
            Log::error('Logo upload failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to upload logo.'], 500);
        }
    }

    public function uploadPaymentQr(Request $request)
    {
        $request->validate([
            'method' => 'required|string|in:esewa,khalti,bank,fonepay',
            'qr_image' => ['required', new \App\Rules\ValidateImageFile()],
        ]);

        $restaurant = $request->user()->restaurant;
        $method = $request->input('method');

        try {
            $url = $this->storeImageWithFallback(
                $request->file('qr_image'),
                'payment-qr',
                $restaurant->id . '-' . $method,
                600
            );

            // Store in restaurant settings
            $settings = $restaurant->settings ?? [];
            $paymentMethods = $settings['payment_methods'] ?? [];
            $paymentMethods[$method]['qr_image'] = $url;
            $settings['payment_methods'] = $paymentMethods;
            $restaurant->update(['settings' => $settings]);


        return response()->json(['url' => $url, 'method' => $method]);
    }

    public function updatePaymentMethod(Request $request)
    {
        $request->validate([
            'method'       => 'required|string|in:esewa,khalti,bank,fonepay',
            'enabled'      => 'required|boolean',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'instructions' => 'nullable|string|max:500',
        ]);

        $restaurant = $request->user()->restaurant;
        $method = $request->input('method');

        $settings = $restaurant->settings ?? [];
        $paymentMethods = $settings['payment_methods'] ?? [];
        $existing = $paymentMethods[$method] ?? [];

        $paymentMethods[$method] = array_merge($existing, [
            'enabled'        => $request->boolean('enabled'),
            'account_name'   => $request->input('account_name'),
            'account_number' => $request->input('account_number'),
            'instructions'   => $request->input('instructions'),
        ]);

        $settings['payment_methods'] = $paymentMethods;
        $restaurant->update(['settings' => $settings]);

        return response()->json(['payment_methods' => $paymentMethods]);
    }

    private function encodeForUpload($image): array
    {
        if (function_exists('imagewebp')) {
            return [$image->toWebp(), 'webp'];
        }

        return [$image->toPng(), 'png'];
    }

    private function storeImageWithFallback(UploadedFile $file, string $directory, string $basename, int $resizeWidth): string
    {
        $diskName = $this->resolveUploadDisk();
        $disk = Storage::disk($diskName);

        try {
            $image = Image::read($file)->scale(width: $resizeWidth);
            [$encodedImage, $extension] = $this->encodeForUpload($image);
            $filename = $directory . '/' . $basename . '.' . $extension;
            $disk->put($filename, $encodedImage);
        } catch (\Throwable $e) {
            Log::warning('Image optimization failed, storing original file.', [
                'path' => $directory . '/' . $basename,
                'error' => $e->getMessage(),
            ]);

            $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
            $filename = $directory . '/' . $basename . '.' . $extension;
            $disk->putFileAs($directory, $file, $basename . '.' . $extension);
        }

        return $disk->url($filename);
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
}
