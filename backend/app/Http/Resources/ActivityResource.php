<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\AccessSignature;

class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'summary' => $this->summary,
            'properties' => $this->properties,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),
            'inquiry' => $this->whenLoaded('inquiry', fn () => $this->inquiry ? [
                'id' => $this->inquiry->id,
                'contact_name' => $this->inquiry->contact_name,
                'access' => $request->user() ? AccessSignature::issue($request->user(), 'inquiry', $this->inquiry->id) : null,
            ] : null),
        ];
    }
}
