<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Services\ActivityLogger;
use App\Support\InputRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => InputRules::email(),
            'password' => ['required', 'string', 'max:128'],
        ], InputRules::messages());

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return response()->json([
            'user' => new UserResource(auth('api')->user()),
        ])->cookie($this->tokenCookie($token));
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json([
            'message' => 'Logged out.',
        ])->cookie(cookie()->forget('token'));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('manager')),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password:api'],
            'password' => [...InputRules::password(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => $data['password'],
        ]);

        app(ActivityLogger::class)->log(
            $request->user(),
            null,
            'user.password_changed',
            'Changed their password.',
        );

        return response()->json([
            'message' => 'Password updated.',
        ]);
    }

    private function tokenCookie(string $token): Cookie
    {
        return cookie(
            'token',
            $token,
            (int) config('jwt.ttl'),
            '/',
            null,
            false,
            true,
            false,
            'lax'
        );
    }
}
