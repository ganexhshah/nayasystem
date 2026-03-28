@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        Reset your password
    </p>

    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#374151;">
        Hi {{ $name }}, we received a request to reset your Naya System password.
    </p>

    <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;color:#374151;">
        This link will expire in {{ $expiresInMinutes }} minutes.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;">
        <tr>
            <td style="border-radius:8px;background:#111827;">
                <a href="{{ $resetUrl }}"
                   style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                    Reset Password
                </a>
            </td>
        </tr>
    </table>

    <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;word-break:break-all;">
        If the button does not work, copy this link into your browser:<br>
        <a href="{{ $resetUrl }}" style="color:#2563eb;">{{ $resetUrl }}</a>
    </p>
@endsection

