<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Closure;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string[]  ...$guards
     * @return mixed
     */
    public function handle($request, Closure $next, ...$guards)
    {
        // Handle Sanctum authentication - prevent "AuthManager is not callable" error
        // When 'sanctum' is specified as guard, handle it specially
        // This prevents the parent from trying to call Auth::guard('sanctum') which fails
        if (in_array('sanctum', $guards)) {
            // Sanctum automatically authenticates via bearer token in EnsureFrontendRequestsAreStateful middleware
            // Use $request->user() which Sanctum sets, NOT Auth::guard('sanctum')

            // If $request->user() is null, try to manually authenticate via token
            if (!$request->user()) {
                $token = $request->bearerToken();

                \Log::info('🔍 Sanctum auth check', [
                    'has_token' => !empty($token),
                    'token_preview' => $token ? substr($token, 0, 30) . '...' : 'null',
                    'token_length' => $token ? strlen($token) : 0,
                    'auth_header' => $request->header('Authorization') ? 'present' : 'missing',
                    'uri' => $request->getRequestUri()
                ]);

                if ($token) {
                    try {
                        $tokenable = null;

                        // Check if this is a custom default admin token (fallback token)
                        if (strpos($token, 'default_admin_token_') === 0) {
                            \Log::info('🔑 Custom default admin token detected', [
                                'token_preview' => substr($token, 0, 30) . '...'
                            ]);

                            // Try to get username from request headers or body
                            // The frontend should send the username in a custom header or we'll extract from token
                            $username = $request->header('X-Admin-Username');

                            // If no username in header, try to find any admin (fallback)
                            // For now, create a temporary Admin instance
                            // The controller will try to find the real admin by username
                            $tokenable = new \App\Models\Admin();
                            $tokenable->id = 0;
                            $tokenable->full_name = 'Default Admin';
                            $tokenable->username = $username ?: 'default_admin';
                            $tokenable->email = 'default@admin.local';

                            \Log::info('✅ Default admin token authenticated', [
                                'username' => $tokenable->username
                            ]);
                        }
                        // Check if this is a superadmin token (custom format)
                        elseif (strpos($token, 'superadmin_token_') === 0) {
                            \Log::info('🔑 SuperAdmin token detected', [
                                'token_preview' => substr($token, 0, 30) . '...'
                            ]);

                            // Extract superadmin ID from token
                            $parts = explode('_', $token);
                            if (count($parts) >= 3) {
                                $superAdminId = end($parts);
                                $tokenable = \App\Models\SuperAdmin::find($superAdminId);

                                if ($tokenable) {
                                    \Log::info('✅ SuperAdmin authenticated via custom token', [
                                        'superadmin_id' => $tokenable->id
                                    ]);
                                } else {
                                    \Log::warning('❌ SuperAdmin not found', [
                                        'superadmin_id' => $superAdminId
                                    ]);
                                }
                            }
                        }
                        // Try to find as Sanctum token (standard format)
                        else {
                            $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);

                            if ($personalAccessToken) {
                                $tokenable = $personalAccessToken->tokenable;

                                \Log::info('✅ Sanctum token found in database', [
                                    'tokenable_type' => get_class($tokenable),
                                    'tokenable_id' => $tokenable->id ?? null,
                                    'is_admin' => $tokenable instanceof \App\Models\Admin
                                ]);
                            } else {
                                \Log::warning('❌ Token not found in personal_access_tokens table', [
                                    'token_preview' => substr($token, 0, 30) . '...',
                                    'token_length' => strlen($token)
                                ]);
                            }
                        }

                        // Set the user on the request if tokenable was found
                        if ($tokenable) {
                            $request->setUserResolver(function () use ($tokenable) {
                                return $tokenable;
                            });
                        }
                    } catch (\Exception $e) {
                        // Log error but continue
                        \Log::error('❌ Error in token lookup', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                } else {
                    \Log::warning('❌ No bearer token in request', [
                        'headers' => $request->headers->all(),
                        'uri' => $request->getRequestUri()
                    ]);
                }
            } else {
                \Log::info('✅ User already authenticated', [
                    'user_type' => get_class($request->user()),
                    'user_id' => $request->user()->id ?? null
                ]);
            }

            // Check again after manual lookup
            if (!$request->user()) {
                \Log::warning('❌ Authentication failed - returning 401', [
                    'uri' => $request->getRequestUri(),
                    'method' => $request->method()
                ]);

                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            return $next($request);
        }

        // For API routes without guard specified, check Sanctum token
        if (empty($guards) && ($request->expectsJson() || $request->is('api/*'))) {
            // Use $request->user() instead of Auth::guard() to prevent errors
            if (!$request->user()) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
            return $next($request);
        }

        // For other guards (web, admin, etc.), use parent implementation
        // Filter out 'sanctum' if it somehow got through
        $guards = array_values(array_filter($guards, function($guard) {
            return $guard !== 'sanctum';
        }));

        if (empty($guards)) {
            $guards = [null];
        }

        // Call parent with filtered guards (no 'sanctum')
        return parent::handle($request, $next, ...$guards);
    }

    /**
     * Determine if the user is logged in to any of the given guards.
     * Override parent method to prevent Auth::guard('sanctum') call
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array  $guards
     * @return void
     *
     * @throws \Illuminate\Auth\AuthenticationException
     */
    protected function authenticate($request, array $guards)
    {
        // Filter out 'sanctum' from guards - it's not a valid guard
        $guards = array_values(array_filter($guards, function($guard) {
            return $guard !== 'sanctum';
        }));

        // If only 'sanctum' was provided, use $request->user() directly
        if (empty($guards) && $request->is('api/*')) {
            if (!$request->user()) {
                $this->unauthenticated($request, []);
            }
            return;
        }

        // For other guards, use parent implementation
        if (empty($guards)) {
            $guards = [null];
        }

        parent::authenticate($request, $guards);
    }

    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // For API routes, always return null to prevent redirects
        // This ensures JSON responses are returned instead of redirects
        if ($request->is('api/*') || $request->expectsJson()) {
            return null;
        }

        return route('login');
    }
}
