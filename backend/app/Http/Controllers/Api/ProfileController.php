<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->load(['restaurant', 'roles']));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'current_password' => 'nullable|string',
            'password' => ['nullable', 'string', 'confirmed', function ($attribute, $value, $fail) {
                if ($value !== null) {
                    $rule = new \App\Rules\ComplexPassword();
                    $rule->validate($attribute, $value, $fail);
                }
            }],
        ]);

        if (isset($data['password'])) {
            if (!Hash::check($data['current_password'] ?? '', $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
            $data['password'] = Hash::make($data['password']);
        }

        $user->update(array_filter($data, fn($v) => $v !== null));
        return response()->json($user->fresh());
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => ['required', new \App\Rules\ValidateImageFile()]]);
        $user = $request->user();

        try {
            $image = Image::read($request->file('avatar'))->scale(width: 200);
            [$encodedImage, $extension] = $this->encodeForUpload($image);
            $filename = 'avatars/' . $user->id . '.' . $extension;
            Storage::disk('s3')->put($filename, $encodedImage);
            $url = Storage::disk('s3')->url($filename);

            $user->update(['avatar' => $url]);
            return response()->json(['avatar' => $url]);
        } catch (\Throwable $e) {
            \Log::error('Avatar upload failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to process avatar upload.'], 500);
        }
    }

    private function encodeForUpload($image): array
    {
        if (function_exists('imagewebp')) {
            return [$image->toWebp(), 'webp'];
        }

        return [$image->toPng(), 'png'];
    }
}
