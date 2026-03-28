<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Rules\ValidateImageFile;
use Illuminate\Http\Request;
use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\HeadingRowImport;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuItem::with('category')
            ->where('restaurant_id', $request->user()->restaurant_id);

        if ($request->category_id) $query->where('category_id', $request->category_id);
        if ($request->search) $query->where('name', 'ilike', "%{$request->search}%");

        return response()->json($query->orderBy('sort_order')->paginate(50));
    }

    public function publicMenu(Request $request, string $slug)
    {
        $restaurant = \App\Models\Restaurant::where('slug', $slug)->firstOrFail();
        $items = MenuItem::with('category')
            ->where('restaurant_id', $restaurant->id)
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->get();
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_veg' => 'nullable|boolean',
            'item_type' => 'nullable|string|in:Veg,Non Veg,Egg,Drink,Halal,Other',
            'is_available' => 'nullable|boolean',
            'is_instant' => 'nullable|boolean',
            'tax_rate' => 'nullable|numeric|min:0',
            'preparation_time' => 'nullable|integer',
            'image' => ['nullable', new ValidateImageFile()],
        ]);

        abort_if(
            !MenuCategory::where('id', $data['category_id'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->exists(),
            403
        );

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadImage($request->file('image'));
        }

        [$data['item_type'], $data['is_veg']] = $this->resolveItemTypeAndVeg(
            $data['item_type'] ?? null,
            $data['is_veg'] ?? null
        );

        $item = MenuItem::create(array_merge($data, [
            'restaurant_id' => $request->user()->restaurant_id,
        ]));

        return response()->json($item->load('category'), 201);
    }

    public function show(Request $request, MenuItem $menuItem)
    {
        abort_if($menuItem->restaurant_id !== $request->user()->restaurant_id, 403);
        return response()->json($menuItem->load(['category', 'modifierGroups.modifiers']));
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        abort_if($menuItem->restaurant_id !== $request->user()->restaurant_id, 403);

        $data = $request->validate([
            'category_id' => 'sometimes|exists:menu_categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'is_veg' => 'nullable|boolean',
            'item_type' => 'nullable|string|in:Veg,Non Veg,Egg,Drink,Halal,Other',
            'is_available' => 'nullable|boolean',
            'is_instant' => 'nullable|boolean',
            'tax_rate' => 'nullable|numeric|min:0',
            'preparation_time' => 'nullable|integer',
            'image' => ['nullable', new ValidateImageFile()],
        ]);

        if (!empty($data['category_id'])) {
            abort_if(
                !MenuCategory::where('id', $data['category_id'])
                    ->where('restaurant_id', $request->user()->restaurant_id)
                    ->exists(),
                403
            );
        }

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadImage($request->file('image'));
        }

        if (array_key_exists('item_type', $data) || array_key_exists('is_veg', $data)) {
            [$data['item_type'], $data['is_veg']] = $this->resolveItemTypeAndVeg(
                $data['item_type'] ?? $menuItem->item_type,
                $data['is_veg'] ?? $menuItem->is_veg
            );
        }

        $menuItem->update($data);
        return response()->json($menuItem->fresh()->load('category'));
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        abort_if($menuItem->restaurant_id !== $request->user()->restaurant_id, 403);
        $menuItem->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function bulkImport(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt,xlsx,xls']);

        $restaurantId = $request->user()->restaurant_id;
        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        // Parse rows into array of associative arrays
        if ($ext === 'csv' || $ext === 'txt') {
            $rows = $this->parseCsv($file->getRealPath());
        } else {
            $rows = $this->parseExcel($file->getRealPath());
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        // Cache categories and menus to avoid repeated DB hits
        $categoryCache = [];
        $menuCache = [];

        foreach ($rows as $i => $row) {
            $rowNum = $i + 2; // 1-indexed + header row

            $name = trim($row['item_name'] ?? '');
            $price = $row['price'] ?? null;

            if (!$name || $price === null || $price === '') {
                $errors[] = "Row {$rowNum}: missing item_name or price";
                $skipped++;
                continue;
            }

            // Auto-create or find category
            $categoryName = trim($row['category_name'] ?? 'Uncategorized');
            $cacheKey = strtolower($categoryName);
            if (!isset($categoryCache[$cacheKey])) {
                $category = MenuCategory::firstOrCreate(
                    ['restaurant_id' => $restaurantId, 'name' => $categoryName],
                    ['is_active' => true, 'sort_order' => 0]
                );
                $categoryCache[$cacheKey] = $category->id;
            }
            $categoryId = $categoryCache[$cacheKey];

            // Determine is_veg
            $typeRaw = strtolower(trim($row['type'] ?? 'veg'));
            $itemType = $this->normalizeImportedItemType($typeRaw);
            $isVeg = $this->typeIsVeg($itemType);

            // Create menu item (skip duplicates by name+category)
            $item = MenuItem::firstOrCreate(
                ['restaurant_id' => $restaurantId, 'category_id' => $categoryId, 'name' => $name],
                [
                    'price' => (float) $price,
                    'description' => trim($row['description'] ?? ''),
                    'item_type' => $itemType,
                    'is_veg' => $isVeg,
                    'is_available' => strtolower(trim($row['show_on_customer_site'] ?? 'yes')) !== 'no',
                    'sort_order' => 0,
                ]
            );

            // Auto-create or find menu and attach item
            $menuName = trim($row['menu_name'] ?? '');
            if ($menuName) {
                $menuKey = strtolower($menuName);
                if (!isset($menuCache[$menuKey])) {
                    $menu = Menu::firstOrCreate(
                        ['restaurant_id' => $restaurantId, 'name' => $menuName],
                        ['is_active' => true]
                    );
                    $menuCache[$menuKey] = $menu->id;
                }
                $item->menus()->syncWithoutDetaching([$menuCache[$menuKey]]);
            }

            $imported++;
        }

        return response()->json([
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function parseCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');
        $headers = null;
        while (($line = fgetcsv($handle)) !== false) {
            if (!$headers) {
                $headers = array_map(fn($h) => strtolower(trim($h)), $line);
                continue;
            }
            if (count($line) === count($headers)) {
                $rows[] = array_combine($headers, $line);
            }
        }
        fclose($handle);
        return $rows;
    }

    private function parseExcel(string $path): array
    {
        $data = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
            public function array(array $array): array { return $array; }
        }, $path);

        if (empty($data[0])) return [];

        $sheet = $data[0];
        $headers = array_map(fn($h) => strtolower(trim((string)$h)), $sheet[0]);
        $rows = [];
        foreach (array_slice($sheet, 1) as $line) {
            if (count($line) === count($headers)) {
                $rows[] = array_combine($headers, array_map('strval', $line));
            }
        }
        return $rows;
    }

    public function sort(Request $request)
    {
        $request->validate(['items' => 'required|array', 'items.*.id' => 'required|integer', 'items.*.sort_order' => 'required|integer']);
        foreach ($request->items as $item) {
            MenuItem::where('id', $item['id'])
                ->where('restaurant_id', $request->user()->restaurant_id)
                ->update(['sort_order' => $item['sort_order']]);
        }
        return response()->json(['message' => 'Sorted.']);
    }

    private function uploadImage($file): string
    {
        $diskName = $this->resolveUploadDisk();
        $disk = Storage::disk($diskName);

        try {
            $image = Image::read($file)->scale(width: 800);
            [$encodedImage, $extension] = $this->encodeForUpload($image);
            $payload = $encodedImage;
        } catch (\Throwable $e) {
            Log::warning('Menu item image optimization failed, storing original file.', [
                'error' => $e->getMessage(),
            ]);

            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $payload = file_get_contents($file->getRealPath());
        }

        $filename = 'menu-items/' . uniqid() . '.' . $extension;
        $disk->put($filename, $payload);
        return $disk->url($filename);
    }

    private function encodeForUpload($image): array
    {
        if (function_exists('imagewebp')) {
            return [$image->toWebp(), 'webp'];
        }

        return [$image->toPng(), 'png'];
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

    private function resolveItemTypeAndVeg(?string $itemType, ?bool $isVeg): array
    {
        if ($itemType) {
            return [$itemType, $this->typeIsVeg($itemType)];
        }

        $resolvedIsVeg = $isVeg ?? true;

        return [$resolvedIsVeg ? 'Veg' : 'Non Veg', $resolvedIsVeg];
    }

    private function typeIsVeg(string $itemType): bool
    {
        return !in_array($itemType, ['Non Veg', 'Egg', 'Halal'], true);
    }

    private function normalizeImportedItemType(string $typeRaw): string
    {
        return match ($typeRaw) {
            'non veg', 'non-veg', 'nonveg', 'chicken', 'meat' => 'Non Veg',
            'egg' => 'Egg',
            'drink', 'drinks', 'beverage', 'beverages' => 'Drink',
            'halal' => 'Halal',
            'other' => 'Other',
            default => 'Veg',
        };
    }
}
