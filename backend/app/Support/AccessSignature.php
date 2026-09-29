<?php

namespace App\Support;

use App\Models\User;

final class AccessSignature
{
    /**
     * @return array{expires: int, signature: string}
     */
    public static function issue(User $user, string $type, int $id, int $hours = 8): array
    {
        $expires = now()->addHours($hours)->getTimestamp();
        $payload = $user->id.'|'.$type.'|'.$id.'|'.$expires;

        return [
            'expires' => $expires,
            'signature' => hash_hmac('sha256', $payload, (string) config('app.key')),
        ];
    }

    public static function valid(User $user, string $type, int $id, mixed $expires, mixed $signature): bool
    {
        if (! is_string($signature) || ! ctype_digit((string) $expires)) {
            return false;
        }

        if ((int) $expires < time()) {
            return false;
        }

        $payload = $user->id.'|'.$type.'|'.$id.'|'.$expires;
        $expected = hash_hmac('sha256', $payload, (string) config('app.key'));

        return hash_equals($expected, $signature);
    }
}
