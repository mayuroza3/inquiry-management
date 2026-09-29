<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\InputRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => InputRules::personName(),
            'email' => [
                ...InputRules::email(),
                Rule::unique('users', 'email'),
            ],
            'password' => [...InputRules::password(), 'confirmed'],
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
        ], InputRules::messages());

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? User::ROLE_SALES,
            'is_approved' => false,
            'manager_id' => $data['manager_id'] ?? null,
        ]);

        app(ActivityLogger::class)->log(
            $user,
            null,
            'user.registered',
            'Registered account '.$user->name.' (pending approval).'
        );

        $token = auth('api')->login($user);

        return response()->json([
            'message' => 'Account created successfully. Your account is pending administrator approval before you can access inquiries.',
            'user' => new UserResource($user),
        ], 201)->cookie($this->tokenCookie($token));
    }

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
            'Changed their password.'
        );

        return response()->json([
            'message' => 'Password updated.',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => InputRules::email(),
        ], InputRules::messages());

        $user = User::query()->where('email', $data['email'])->first();

        if ($user === null) {
            // Return success to prevent email enumeration
            return response()->json([
                'message' => 'If an account exists with that email, a password reset link has been sent.',
            ]);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $appUrl = rtrim(config('app.url', 'http://127.0.0.1:8000'), '/');
        $resetUrl = "{$appUrl}/reset-password?token={$token}&email=".urlencode($user->email);

        $mailSent = true;
        try {
            Mail::to($user->email)->send(new ResetPasswordMail($user->email, $token, $resetUrl));
        } catch (\Throwable $e) {
            $mailSent = false;
        }

        $defaultMailer = config('mail.default');
        $smtpHost = config('mail.mailers.smtp.host');
        $isEmailConfigured = $mailSent
            && ! in_array($defaultMailer, ['log', 'array'], true)
            && filled($smtpHost)
            && $smtpHost !== '127.0.0.1';

        $showResetUrl = ! $isEmailConfigured || config('app.env') === 'local' || config('app.debug');

        return response()->json([
            'message' => 'If an account exists with that email, a password reset link has been sent.',
            'reset_url' => $showResetUrl ? $resetUrl : null,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => InputRules::email(),
            'token' => ['required', 'string'],
            'password' => [...InputRules::password(), 'confirmed'],
        ], InputRules::messages());

        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if ($record === null || ! Hash::check($data['token'], $record->token)) {
            return response()->json([
                'message' => 'Invalid or expired password reset token.',
            ], 422);
        }

        // Token expires after 60 minutes
        if ($record->created_at !== null && now()->parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

            return response()->json([
                'message' => 'Password reset token has expired. Please request a new one.',
            ], 422);
        }

        $user = User::query()->where('email', $data['email'])->first();

        if ($user === null) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        $user->update([
            'password' => $data['password'],
        ]);

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        app(ActivityLogger::class)->log(
            $user,
            null,
            'user.password_reset',
            'Reset their password via password reset token.'
        );

        return response()->json([
            'message' => 'Password has been reset successfully. You can now log in with your new password.',
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
