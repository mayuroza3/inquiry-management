<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Inquiry;
use App\Models\User;

class ActivityLogger
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public function log(?User $actor, ?Inquiry $inquiry, string $action, string $summary, array $properties = []): Activity
    {
        return Activity::query()->create([
            'user_id' => $actor?->id,
            'inquiry_id' => $inquiry?->id,
            'action' => $action,
            'summary' => $summary,
            'properties' => $properties === [] ? null : $properties,
        ]);
    }
}
