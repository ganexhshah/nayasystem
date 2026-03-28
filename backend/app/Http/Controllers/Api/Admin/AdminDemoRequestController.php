<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DemoRequest;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;

class AdminDemoRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = DemoRequest::query()->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('restaurant_name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, DemoRequest $demoRequest, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,accepted,declined,completed',
            'scheduled_at' => 'nullable|date',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $wasAccepted = $demoRequest->status === 'accepted';
        $isAccepting = $data['status'] === 'accepted';

        $demoRequest->update([
            'status' => $data['status'],
            'scheduled_at' => $data['scheduled_at'] ?? $demoRequest->scheduled_at,
            'admin_note' => $data['admin_note'] ?? $demoRequest->admin_note,
            'accepted_at' => $isAccepting ? now() : $demoRequest->accepted_at,
        ]);

        if ($isAccepting && !$wasAccepted) {
            $businessMailService->sendDemoRequestAccepted($demoRequest->fresh());
        }

        return response()->json($demoRequest->fresh());
    }
}
