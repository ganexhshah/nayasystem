<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name', 'Naya System') }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                    <td style="background:#111827;padding:18px 24px;">
                        <p style="margin:0;color:#f9fafb;font-size:18px;font-weight:700;letter-spacing:.2px;">
                            {{ config('app.name', 'Naya System') }}
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px 24px;">
                        @yield('content')
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 24px 24px 24px;">
                        <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
                            This email was sent by {{ config('app.name', 'Naya System') }}.
                            If you did not expect this email, you can safely ignore it.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>

