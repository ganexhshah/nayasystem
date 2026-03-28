<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemoRequest;
use Illuminate\Http\Request;

class DemoRequestController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'restaurant_name' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
            'team_size' => 'nullable|integer|min:1|max:10000',
            'preferred_date' => 'nullable|string|max:100',
            'message' => 'nullable|string|max:2000',
        ]);

        $demoRequest = DemoRequest::create($data);

        return response()->json([
            'message' => 'Demo request submitted successfully.',
            'demo_request' => $demoRequest,
        ], 201);
    }
}
