<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprovedUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->isApproved()) {
            return response()->json([
                'message' => 'Your account is pending administrator approval before you can access inquiries and leads.',
                'is_approved' => false,
            ], 403);
        }

        return $next($request);
    }
}
