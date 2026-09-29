<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\AccessSignature;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'manager_id' => $this->manager_id,
            'manager' => $this->whenLoaded('manager', fn () => [
                'id' => $this->manager?->id,
                'name' => $this->manager?->name,
            ]),
            'created_at' => $this->created_at,
            'access' => $request->user() ? AccessSignature::issue($request->user(), 'user', $this->id) : null,
        ];
    }
}
