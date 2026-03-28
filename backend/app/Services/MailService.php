<?php

namespace App\Services;

use App\Mail\Auth\PasswordResetMail;
use App\Mail\Auth\PasswordResetSuccessMail;
use App\Mail\Auth\WelcomeMail;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    public function sendWelcomeEmail(User $user): void
    {
        $this->sendWithoutFailure(
            $user->email,
            new WelcomeMail($user->name, $user->restaurant?->name)
        );
    }

    public function sendPasswordResetEmail(User $user, string $resetUrl, int $expiresInMinutes): void
    {
        Mail::to($user->email)->send(
            new PasswordResetMail($user->name, $resetUrl, $expiresInMinutes)
        );
    }

    public function sendPasswordResetSuccessEmail(User $user): void
    {
        $this->sendWithoutFailure(
            $user->email,
            new PasswordResetSuccessMail($user->name)
        );
    }

    private function sendWithoutFailure(string $email, Mailable $mailable): void
    {
        try {
            Mail::to($email)->send($mailable);
        } catch (\Throwable $e) {
            Log::warning('Mail send failed', [
                'email' => $email,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
