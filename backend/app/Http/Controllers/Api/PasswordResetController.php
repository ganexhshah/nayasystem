<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\MailService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(Request $request, MailService $mailService)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $email = Str::lower(trim($data['email']));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user) {
            return response()->json([
                'message' => 'If that email address exists, a reset link has been sent.',
            ]);
        }

        $token = Str::random(64);
        $expiresInMinutes = $this->passwordResetExpiryMinutes();

        DB::table('password_reset_tokens')->where('email', $user->email)->delete();
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        try {
            $mailService->sendPasswordResetEmail(
                $user,
                $this->buildPasswordResetUrl($user->email, $token),
                $expiresInMinutes
            );
        } catch (\Throwable $e) {
            Log::warning('Unable to send password reset email', [
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to send reset email right now. Please try again.',
            ], 500);
        }

        return response()->json([
            'message' => 'If that email address exists, a reset link has been sent.',
        ]);
    }

    public function reset(Request $request, MailService $mailService)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'string', 'confirmed', new \App\Rules\ComplexPassword()],
        ]);

        $email = Str::lower(trim($data['email']));
        $resetToken = DB::table('password_reset_tokens')
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (!$resetToken) {
            return response()->json(['message' => 'This reset link is invalid.'], 422);
        }

        $createdAt = $resetToken->created_at ? Carbon::parse($resetToken->created_at) : null;
        $isExpired = !$createdAt || $createdAt->addMinutes($this->passwordResetExpiryMinutes())->isPast();

        if ($isExpired) {
            DB::table('password_reset_tokens')->where('email', $resetToken->email)->delete();
            return response()->json(['message' => 'This reset link is invalid or has expired.'], 422);
        }

        if (!Hash::check($data['token'], $resetToken->token)) {
            return response()->json(['message' => 'This reset link is invalid or has expired.'], 422);
        }

        $user = User::whereRaw('LOWER(email) = ?', [Str::lower($resetToken->email)])->first();
        if (!$user) {
            DB::table('password_reset_tokens')->where('email', $resetToken->email)->delete();
            return response()->json(['message' => 'This reset link is invalid.'], 422);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $resetToken->email)->delete();

        $mailService->sendPasswordResetSuccessEmail($user);

        return response()->json([
            'message' => 'Password reset successful. Please sign in with your new password.',
        ]);
    }

    private function buildPasswordResetUrl(string $email, string $token): string
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');

        return $frontendUrl.'/auth/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $email,
        ]);
    }

    private function passwordResetExpiryMinutes(): int
    {
        return max((int) env('PASSWORD_RESET_EXPIRES', 60), 5);
    }
}
