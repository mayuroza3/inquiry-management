<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\AccessSignature;

class ReminderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'message' => $this->message,
            'remind_at' => $this->remind_at,
            'is_completed' => $this->is_completed,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
            ]),
            'inquiry' => $this->whenLoaded('inquiry', fn () => $this->inquiry ? [
                'id' => $this->inquiry->id,
                'contact_name' => $this->inquiry->contact_name,
                'access' => $request->user() ? AccessSignature::issue($request->user(), 'inquiry', $this->inquiry->id) : null,
            ] : null),
            'access' => $request->user() ? AccessSignature::issue($request->user(), 'reminder', $this->id) : null,
            'created_at' => $this->created_at,
        ];
    }
}
