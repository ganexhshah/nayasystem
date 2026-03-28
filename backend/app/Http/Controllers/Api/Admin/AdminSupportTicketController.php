<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;

class AdminSupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::with([
            'restaurant:id,name,city',
            'user:id,name,email',
            'messages.user:id,name',
            'messages.admin:id,name,email',
        ])->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhereHas('restaurant', fn ($restaurant) => $restaurant->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }

        return response()->json($query->paginate(20));
    }

    public function update(Request $request, SupportTicket $supportTicket)
    {
        $data = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $supportTicket->update([
            'status' => $data['status'],
            'priority' => $data['priority'],
            'closed_at' => in_array($data['status'], ['resolved', 'closed'], true) ? now() : null,
        ]);

        return response()->json($supportTicket->fresh()->load([
            'restaurant:id,name,city',
            'user:id,name,email',
            'messages.user:id,name',
            'messages.admin:id,name,email',
        ]));
    }

    public function reply(Request $request, SupportTicket $supportTicket, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'message' => 'required|string|max:4000',
        ]);

        $message = SupportTicketMessage::create([
            'support_ticket_id' => $supportTicket->id,
            'admin_id' => $request->user()->id,
            'sender_type' => 'admin',
            'message' => $data['message'],
        ]);

        $supportTicket->update([
            'status' => 'in_progress',
        ]);

        $businessMailService->sendSupportTicketReplyToRestaurant(
            $supportTicket->fresh('restaurant', 'user'),
            $message->message
        );

        return response()->json($supportTicket->fresh()->load([
            'restaurant:id,name,city',
            'user:id,name,email',
            'messages.user:id,name',
            'messages.admin:id,name,email',
        ]));
    }
}
