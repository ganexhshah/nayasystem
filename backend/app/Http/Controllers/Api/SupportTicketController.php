<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Services\BusinessMailService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            SupportTicket::with([
                'user:id,name,email',
                'messages.user:id,name',
                'messages.admin:id,name,email',
            ])
            ->where('restaurant_id', $request->user()->restaurant_id)
            ->latest()
            ->get()
        );
    }

    public function store(Request $request, BusinessMailService $businessMailService)
    {
        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'category' => 'required|in:general,billing,technical,account,training',
            'priority' => 'required|in:low,medium,high,urgent',
            'message' => 'required|string|max:4000',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $ticket = SupportTicket::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'category' => $data['category'],
            'priority' => $data['priority'],
            'status' => 'open',
            'message' => $data['message'],
        ]);

        SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'sender_type' => 'restaurant',
            'message' => $data['message'],
        ] + $this->storeAttachmentMeta($request->file('attachment'), $request->user()->restaurant_id, $ticket->id));

        $businessMailService->sendSupportTicketCreatedToSupport($ticket->fresh('restaurant', 'user'));

        return response()->json($ticket->load([
            'user:id,name,email',
            'messages.user:id,name',
            'messages.admin:id,name,email',
        ]), 201);
    }

    public function reply(Request $request, SupportTicket $supportTicket)
    {
        abort_if($supportTicket->restaurant_id !== $request->user()->restaurant_id, 403);

        $data = $request->validate([
            'message' => 'required|string|max:4000',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $supportTicket->update([
            'status' => in_array($supportTicket->status, ['resolved', 'closed'], true) ? 'open' : $supportTicket->status,
        ]);

        SupportTicketMessage::create([
            'support_ticket_id' => $supportTicket->id,
            'user_id' => $request->user()->id,
            'sender_type' => 'restaurant',
            'message' => $data['message'],
        ] + $this->storeAttachmentMeta($request->file('attachment'), $request->user()->restaurant_id, $supportTicket->id));

        return response()->json($supportTicket->fresh()->load([
            'user:id,name,email',
            'messages.user:id,name',
            'messages.admin:id,name,email',
        ]));
    }

    /**
     * @return array<string, int|string|null>
     */
    private function storeAttachmentMeta(?UploadedFile $file, int|string|null $restaurantId, int $ticketId): array
    {
        if (!$file) {
            return [];
        }

        $disk = Storage::disk($this->resolveUploadDisk());
        $directory = sprintf('support-tickets/%s/%s', $restaurantId ?? 'shared', $ticketId);
        $filename = uniqid('attachment_', true) . '.' . strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $path = $disk->putFileAs($directory, $file, $filename);

        return [
            'attachment_name' => $file->getClientOriginalName(),
            'attachment_path' => $path,
            'attachment_url' => $disk->url($path),
            'attachment_mime' => $file->getClientMimeType(),
            'attachment_size' => $file->getSize(),
        ];
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
