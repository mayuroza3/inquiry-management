<?php

namespace Tests;

use App\Models\User;
use App\Support\AccessSignature;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function signedPath(string $path, User $user, string $type, int $id): string
    {
        $access = AccessSignature::issue($user, $type, $id);
        $join = str_contains($path, '?') ? '&' : '?';

        return $path.$join.'expires='.$access['expires'].'&signature='.$access['signature'];
    }
}

