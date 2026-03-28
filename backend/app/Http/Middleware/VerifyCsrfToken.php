<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     * API routes use Bearer token auth instead of CSRF.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // All API routes use Bearer token authentication via Sanctum
        'webhooks/*',  // Webhook routes may come from external sources
    ];
}
