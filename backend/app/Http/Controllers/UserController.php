<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\InputRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->with('manager')
            ->orderBy('name')
            ->get();

        return UserResource::collection($users)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $this->validated($request);
        $data['is_approved'] = $data['is_approved'] ?? true;

        $user = User::query()->create($data);
        $user->load('manager');

        app(ActivityLogger::class)->log(
            $request->user(),
            null,
            'user.created',
            'Created user '.$user->name.'.',
            ['user_id' => $user->id, 'role' => $user->role, 'is_approved' => $user->is_approved]
        );

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $data = $this->validated($request, $user);

        $before = $user->only(['name', 'email', 'role', 'is_approved', 'manager_id']);
        $passwordChanging = array_key_exists('password', $data) && $data['password'] !== null && $data['password'] !== '';

        if (! $passwordChanging) {
            unset($data['password']);
        }

        $user->fill($data)->save();
        $user->load('manager');

        $changes = [];
        foreach ($before as $field => $value) {
            if ((string) $user->{$field} !== (string) $value) {
                $changes[$field] = ['from' => $value, 'to' => $user->{$field}];
            }
        }
        if ($passwordChanging) {
            $changes['password'] = 'updated';
        }

        if ($changes !== []) {
            app(ActivityLogger::class)->log(
                $request->user(),
                null,
                'user.updated',
                'Updated user '.$user->name.'.',
                ['user_id' => $user->id, 'changes' => $changes]
            );
        }

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $name = $user->name;
        $userId = $user->id;
        $user->delete();

        app(ActivityLogger::class)->log(
            $request->user(),
            null,
            'user.deleted',
            'Deleted user '.$name.'.',
            ['user_id' => $userId]
        );

        return response()->json([
            'message' => 'User deleted.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => InputRules::personName($user !== null),
            'email' => [
                ...InputRules::email($user !== null),
                Rule::unique('users', 'email')->ignore($user),
            ],
            'password' => InputRules::password($user === null),
            'role' => [$user ? 'sometimes' : 'required', Rule::in(User::ROLES)],
            'is_approved' => ['sometimes', 'boolean'],
            'manager_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                ...($user ? [Rule::notIn([$user->id])] : []),
            ],
        ], InputRules::messages());
    }
}
