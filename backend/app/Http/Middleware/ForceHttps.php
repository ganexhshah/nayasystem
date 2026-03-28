<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only enforce HTTPS in production matching configuration
        if (env('FORCE_HTTPS', false) && !$request->secure()) {
            Log::warning('Non-HTTPS request attempted', [
                'url' => $request->url(),
                'ip' => $request->ip(),
            ]);
            
            // Redirect to HTTPS
            return redirect(
                'https://' . $request->getHost() . $request->getRequestUri(),
                301
            );
        }

        $response = $next($request);

        // Add HSTS header if enabled (HTTPS Strict Transport Security)
        if (env('ENABLE_HSTS', false)) {
            $hstsMaxAge = env('HSTS_MAX_AGE', 31536000); // 1 year default
            $response->headers->set(
                'Strict-Transport-Security',
                "max-age={$hstsMaxAge}; includeSubDomains; preload"
            );
        }

        // Additional security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
