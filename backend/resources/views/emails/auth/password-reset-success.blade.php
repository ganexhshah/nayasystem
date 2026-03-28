@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        Password changed successfully
    </p>

    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">
        Hi {{ $name }}, your Naya System password was updated.
    </p>

    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
        If this was not you, reset your password immediately and contact support.
    </p>
@endsection

