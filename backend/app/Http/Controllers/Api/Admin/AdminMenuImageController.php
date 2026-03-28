<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class AdminMenuImageController extends Controller
{
    /**
     * List all menu items that have an image, across all restaurants.
     */
    public function index(Request $request)
    {
        $query = MenuItem::with('category')
            ->whereNotNull('image')
            ->where('image', '!=', '');

        if ($request->search) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        $items = $query->orderBy('updated_at', 'desc')->paginate(48);

        return response()->json($items);
    }

    /**
     * Remove the image from a menu item (sets image to null).
     */
    public function destroy(MenuItem $menuItem)
    {
        $menuItem->update(['image' => null]);
        return response()->json(['message' => 'Image removed.']);
    }

    /**
     * Upload an image for a menu item by name (admin bulk upload).
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'image' => 'required|image|max:4096',
        ]);

        $url = $this->uploadImage($request->file('image'));

        // Try to find and update matching menu items across all restaurants
        $updated = MenuItem::whereRaw('LOWER(name) = ?', [strtolower($request->name)])
            ->update(['image' => $url]);

        return response()->json([
            'url'          => $url,
            'name'         => $request->name,
            'items_updated' => $updated,
        ], 201);
    }

    private function uploadImage($file): string
    {
        try {
            $image = Image::read($file)->scale(width: 800);
            if (function_exists('imagewebp')) {
                $encoded = $image->toWebp();
                $ext = 'webp';
            } else {
                $encoded = $image->toPng();
                $ext = 'png';
            }
        } catch (\Throwable $e) {
            $encoded = file_get_contents($file->getRealPath());
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
        }

        $filename = 'menu-items/' . uniqid() . '.' . $ext;
        Storage::disk('s3')->put($filename, $encoded);
        return Storage::disk('s3')->url($filename);
    }
}
