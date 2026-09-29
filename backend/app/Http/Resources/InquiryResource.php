<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\AccessSignature;

class InquiryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contact_name' => $this->contact_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'message' => $this->message,
            'status' => $this->status,
            'assigned_to' => $this->assigned_to,
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
                'email' => $this->assignee->email,
                'role' => $this->assignee->role,
            ] : null),
            'lead_source_id' => $this->lead_source_id,
            'lead_source' => $this->whenLoaded('leadSource', fn () => $this->leadSource ? [
                'id' => $this->leadSource->id,
                'name' => $this->leadSource->name,
            ] : null),
            'notes' => NoteResource::collection($this->whenLoaded('notes')),
            'comments' => NoteResource::collection($this->whenLoaded('comments')),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'reminders' => ReminderResource::collection($this->whenLoaded('reminders')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'access' => $request->user() ? AccessSignature::issue($request->user(), 'inquiry', $this->id) : null,
        ];
    }
}
