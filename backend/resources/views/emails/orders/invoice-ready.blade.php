@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        Invoice {{ $order->order_number }}
    </p>

    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
        Your invoice is ready from <strong>{{ $restaurant->name }}</strong>.
    </p>

    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
        Total amount: {{ number_format((float) $order->total, 2) }}
    </p>

    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
        Status: {{ $order->status }} | Payment: {{ $order->payment_status }}
    </p>

    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
        A PDF invoice is attached when available.
    </p>
@endsection

