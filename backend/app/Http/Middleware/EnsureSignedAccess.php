<?php

namespace App\Http\Middleware;

use App\Support\AccessSignature;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSignedAccess
{
    public function handle(Request $request, Closure $next, string $type): Response
    {
        $parameter = $request->route($type);
        $id = is_object($parameter) ? (int) $parameter->id : (int) $parameter;
        $user = $request->user();
        $expires = $request->query('expires');
        $signature = $request->query('signature');

        if ($user === null || $id < 1 || ! AccessSignature::valid($user, $type, $id, $expires, $signature)) {
            abort(403, 'This link is invalid or has expired.');
        }

        return $next($request);
    }
}
