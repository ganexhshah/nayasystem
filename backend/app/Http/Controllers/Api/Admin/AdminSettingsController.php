<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminSettingsController extends Controller
{
    private const KEY = 'admin_platform_settings';

    private function defaults(): array
    {
        return [
            'platform_name'  => 'NayaSystem',
            'support_email'  => 'support@nayasystem.com',
            'trial_days'     => 14,
            'currency'       => 'NPR',
            'admin_email'    => 'admin@nayasystem.com',
        ];
    }

    public function show()
    {
        $settings = Cache::get(self::KEY, $this->defaults());
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'platform_name' => 'sometimes|string|max:100',
            'support_email' => 'sometimes|email',
            'trial_days'    => 'sometimes|integer|min:0',
            'currency'      => 'sometimes|string|max:10',
            'admin_email'   => 'sometimes|email',
        ]);

        $current  = Cache::get(self::KEY, $this->defaults());
        $updated  = array_merge($current, $data);
        Cache::forever(self::KEY, $updated);

        return response()->json($updated);
    }
}
