<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReminderResource;
use App\Models\Inquiry;
use App\Models\Reminder;
use App\Services\ActivityLogger;
use App\Support\InputRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inquiry::class);

        $user = $request->user();
        $query = Reminder::query()
            ->with(['inquiry:id,contact_name', 'user:id,name'])
            ->where('is_completed', false)
            ->whereBetween('remind_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->orderBy('remind_at');

        if (! $user->isAdmin()) {
            $query->whereIn('inquiry_id', Inquiry::query()->visibleTo($user)->select('id'));
        }

        return ReminderResource::collection($query->limit(12)->get())->response();
    }

    public function store(Request $request, Inquiry $inquiry): ReminderResource
    {
        $this->authorize('update', $inquiry);

        $data = $request->validate([
            'message' => InputRules::prose(255),
            'remind_at' => ['required', 'date'],
        ], InputRules::messages());

        $reminder = $inquiry->reminders()->create([
            'user_id' => $request->user()->id,
            'message' => $data['message'],
            'remind_at' => $data['remind_at'],
        ]);

        $reminder->load('user');

        app(ActivityLogger::class)->log(
            $request->user(),
            $inquiry,
            'reminder.added',
            'Added a reminder: '.$reminder->message.'.',
        );

        return new ReminderResource($reminder);
    }

    public function update(Request $request, Reminder $reminder): ReminderResource
    {
        $this->authorize('update', $reminder->inquiry);

        $data = $request->validate([
            'is_completed' => ['sometimes', 'boolean'],
            'message' => InputRules::prose(255, true),
            'remind_at' => ['sometimes', 'required', 'date'],
        ], InputRules::messages());

        $wasCompleted = $reminder->is_completed;
        $reminder->fill($data)->save();
        $reminder->load('user');

        if (array_key_exists('is_completed', $data) && (bool) $data['is_completed'] !== (bool) $wasCompleted) {
            app(ActivityLogger::class)->log(
                $request->user(),
                $reminder->inquiry,
                'reminder.updated',
                $reminder->is_completed ? 'Completed a reminder.' : 'Reopened a reminder.',
            );
        }

        return new ReminderResource($reminder);
    }
}
