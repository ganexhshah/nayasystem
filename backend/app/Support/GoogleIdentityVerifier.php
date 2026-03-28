<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use RuntimeException;

class GoogleIdentityVerifier
{
    /**
     * Verify a Google/Firebase identity token and normalize core claims.
     *
     * @return array{uid:string,email:string,name:?string,picture:?string}
     */
    public function verify(string $idToken, FirebaseAuth $firebaseAuth): array
    {
        try {
            $verifiedToken = $firebaseAuth->verifyIdToken($idToken);
            $claims = $verifiedToken->claims();

            return [
                'uid' => (string) $claims->get('sub'),
                'email' => (string) $claims->get('email'),
                'name' => $claims->get('name'),
                'picture' => $claims->get('picture'),
            ];
        } catch (\Throwable) {
            return $this->verifyWithGoogleTokenInfo($idToken);
        }
    }

    /**
     * Fallback verifier for Google OAuth ID tokens.
     *
     * @return array{uid:string,email:string,name:?string,picture:?string}
     */
    private function verifyWithGoogleTokenInfo(string $idToken): array
    {
        $response = Http::timeout(10)
            ->acceptJson()
            ->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);

        if (!$response->ok()) {
            throw new RuntimeException('Token could not be verified.');
        }

        $data = $response->json();
        $issuer = (string) ($data['iss'] ?? '');

        if (!in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)) {
            throw new RuntimeException('Token issuer is invalid.');
        }

        $email = (string) ($data['email'] ?? '');
        $uid = (string) ($data['sub'] ?? '');
        $emailVerified = filter_var($data['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($email === '' || $uid === '' || !$emailVerified) {
            throw new RuntimeException('Token is missing required verified identity claims.');
        }

        $this->assertAllowedAudience($data['aud'] ?? null);

        return [
            'uid' => $uid,
            'email' => $email,
            'name' => isset($data['name']) ? (string) $data['name'] : null,
            'picture' => isset($data['picture']) ? (string) $data['picture'] : null,
        ];
    }

    private function assertAllowedAudience(mixed $audience): void
    {
        $configured = (string) env('GOOGLE_CLIENT_IDS', env('GOOGLE_CLIENT_ID', ''));

        if ($configured === '') {
            return;
        }

        $allowed = array_values(array_filter(array_map('trim', explode(',', $configured))));
        $aud = is_string($audience) ? $audience : '';

        if (!in_array($aud, $allowed, true)) {
            throw new RuntimeException('Token audience is not allowed.');
        }
    }
}

