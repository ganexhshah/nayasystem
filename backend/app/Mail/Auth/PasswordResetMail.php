<?php

namespace App\Mail\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $resetUrl,
        public int $expiresInMinutes
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your Naya System password'
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.password-reset'
        );
    }
}

