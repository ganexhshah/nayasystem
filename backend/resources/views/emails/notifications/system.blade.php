@extends('emails.layouts.base')

@section('content')
    <p style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827;">
        {{ $title }}
    </p>

    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">
        {{ $greeting }}
    </p>

    @foreach($lines as $line)
        <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#374151;">
            {{ $line }}
        </p>
    @endforeach

    @if($actionText && $actionUrl)
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:14px 0 0 0;">
            <tr>
                <td style="border-radius:8px;background:#111827;">
                    <a href="{{ $actionUrl }}"
                       style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                        {{ $actionText }}
                    </a>
                </td>
            </tr>
        </table>
    @endif
@endsection

