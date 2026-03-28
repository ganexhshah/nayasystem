@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        Demo Request Accepted
    </p>

    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">
        Hi {{ $demoRequest->name }},
    </p>

    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
        Your demo request for <strong>{{ $demoRequest->restaurant_name }}</strong> has been accepted successfully.
    </p>

    @if($demoRequest->scheduled_at)
        <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
            Scheduled Demo Time: {{ $demoRequest->scheduled_at->format('M d, Y h:i A') }}
        </p>
    @endif

    @if($demoRequest->admin_note)
        <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
            Message from our team: {{ $demoRequest->admin_note }}
        </p>
    @endif

    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
        We will contact you shortly and walk you through the system.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:14px 0 0 0;">
        <tr>
            <td style="border-radius:8px;background:#111827;">
                <a href="{{ rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/') }}/bookdemo"
                   style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                    View Demo Page
                </a>
            </td>
        </tr>
    </table>
@endsection
