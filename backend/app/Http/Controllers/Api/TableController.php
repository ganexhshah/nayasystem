<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TableController extends Controller
{
    public function publicTables(string $slug)
    {
        $restaurant = \App\Models\Restaurant::where('slug', $slug)->firstOrFail();
        $tables = Table::with('area:id,name')
            ->where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'area_id', 'name', 'type', 'capacity', 'status', 'is_active', 'image', 'description', 'special_features']);
        return response()->json($tables);
    }

    public function index(Request $request)
    {
        return response()->json(
            Table::with('area')->where('restaurant_id', $request->user()->restaurant_id)->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'area_id'          => 'nullable|exists:table_areas,id',
            'name'             => 'required|string|max:100',
            'type'             => 'nullable|in:table,cabin',
            'capacity'         => 'required|integer|min:1',
            'description'      => 'nullable|string',
            'special_features' => 'nullable|array',
        ]);

        if (!empty($data['area_id'])) {
            abort_if(
                !\App\Models\TableArea::where('id', $data['area_id'])
                    ->where('restaurant_id', $request->user()->restaurant_id)
                    ->exists(),
                403
            );
        }

        $table = Table::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
            'status'        => 'available',
            'type'          => $data['type'] ?? 'table',
        ]));
        return response()->json($table, 201);
    }

    public function show(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($table->load(['area', 'orders' => fn($q) => $q->whereIn('status', ['pending','confirmed','preparing','ready','served'])]));
    }

    public function update(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        $data = $request->validate([
            'name'             => 'sometimes|string',
            'type'             => 'nullable|in:table,cabin',
            'capacity'         => 'sometimes|integer|min:1',
            'status'           => 'sometimes|in:available,occupied,reserved,cleaning',
            'area_id'          => 'nullable|exists:table_areas,id',
            'is_active'        => 'nullable|boolean',
            'description'      => 'nullable|string',
            'special_features' => 'nullable|array',
        ]);

        if (!empty($data['area_id'])) {
            abort_if(
                !\App\Models\TableArea::where('id', $data['area_id'])
                    ->where('restaurant_id', $request->user()->restaurant_id)
                    ->exists(),
                403
            );
        }

        $table->update($data);
        return response()->json($table->fresh());
    }

    public function uploadImage(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        $request->validate(['image' => 'required|image|max:2048']);

        if ($table->image) {
            Storage::disk('public')->delete($table->image);
        }

        $path = $request->file('image')->store('tables', 'public');
        $table->update(['image' => $path]);

        return response()->json(['image' => $path, 'image_url' => Storage::disk('public')->url($path)]);
    }

    public function destroy(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        if ($table->image) {
            Storage::disk('public')->delete($table->image);
        }

        $qrDisk = Storage::disk($this->resolveUploadDisk());
        $qrPath = $this->qrCodePath($table);
        if ($qrDisk->exists($qrPath)) {
            $qrDisk->delete($qrPath);
        }

        $table->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function qrCode(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        $restaurant = $request->user()->restaurant;
        $url = config('app.frontend_url') . "/restaurant/{$restaurant->slug}?table={$table->id}";

        $qrCode = $this->ensureQrCodeExists($table, $url);

        return response()->json([
            'url' => $url,
            'qr_code' => $qrCode,
            'table' => $table->fresh(),
        ]);
    }

    public function downloadQrCode(Request $request, Table $table)
    {
        abort_if($table->restaurant_id !== $request->user()->restaurant_id, 403);
        $restaurant = $request->user()->restaurant;
        $url = config('app.frontend_url') . "/restaurant/{$restaurant->slug}?table={$table->id}";

        $this->ensureQrCodeExists($table, $url);

        $disk = Storage::disk($this->resolveUploadDisk());
        $path = $this->qrCodePath($table);
        if (!$disk->exists($path)) {
            return response()->json(['message' => 'QR image not found.'], 404);
        }

        $fileSafeName = preg_replace('/[^a-z0-9]+/i', '-', $table->name ?: "table-{$table->id}");
        $fileSafeName = trim((string) $fileSafeName, '-');
        $fileName = strtolower($fileSafeName ?: "table-{$table->id}") . '-qr.png';

        return $disk->download($path, $fileName, ['Content-Type' => 'image/png']);
    }

    private function ensureQrCodeExists(Table $table, string $url): ?string
    {
        if (!empty($table->qr_code)) {
            return $table->qr_code;
        }

        try {
            $disk = Storage::disk($this->resolveUploadDisk());
            $path = $this->qrCodePath($table);
            $qrImage = $this->generateQrPng($url);

            $disk->put($path, $qrImage);

            $qrCodeUrl = $disk->url($path);
            $table->update(['qr_code' => $qrCodeUrl]);

            return $qrCodeUrl;
        } catch (\Throwable $e) {
            Log::warning('Unable to persist table QR image.', [
                'table_id' => $table->id,
                'restaurant_id' => $table->restaurant_id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function generateQrPng(string $targetUrl): string
    {
        // Use a hosted generator to avoid requiring extra local PHP QR extensions/packages.
        $response = Http::timeout(12)->get('https://quickchart.io/qr', [
            'text' => $targetUrl,
            'size' => 600,
            'format' => 'png',
            'ecLevel' => 'M',
            'margin' => 1,
        ]);

        if (!$response->ok()) {
            throw new \RuntimeException('QR image request failed with status ' . $response->status());
        }

        $contentType = strtolower((string) $response->header('Content-Type', ''));
        if (!str_contains($contentType, 'image/')) {
            throw new \RuntimeException('QR image request did not return an image response.');
        }

        return $response->body();
    }

    private function qrCodePath(Table $table): string
    {
        return "qr-codes/restaurant-{$table->restaurant_id}/table-{$table->id}.png";
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
