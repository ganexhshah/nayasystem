@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        Welcome, {{ $name }}.
    </p>

    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">
        Your Naya System account is now active.
        @if($restaurantName)
            We have created your workspace for <strong>{{ $restaurantName }}</strong>.
        @endif
    </p>

    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
        You can now sign in and start managing menu, orders, tables, and reports from one place.
    </p>
@endsection

