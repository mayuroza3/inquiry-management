<?php

namespace App\Http\Controllers;

use App\Events\InquiryCreated;
use App\Http\Resources\InquiryResource;
use App\Models\Inquiry;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\InquiryAssigner;
use App\Support\InputRules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InquiryController extends Controller
{
    /** @var list<string> */
    private const ATTACHMENT_EXTENSIONS = [
        'pdf',
        'doc', 'docx',
        'xls', 'xlsx', 'xlsm', 'csv',
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'tif', 'tiff',
    ];

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inquiry::class);

        $inquiries = $this->applyListSort($this->filteredQuery($request), $request)
            ->select([
                'inquiries.id',
                'inquiries.contact_name',
                'inquiries.email',
                'inquiries.phone',
                'inquiries.company',
                'inquiries.status',
                'inquiries.assigned_to',
                'inquiries.lead_source_id',
                'inquiries.created_at',
            ])
            ->with(['assignee:id,name'])
            ->paginate(min($request->integer('per_page', 10), 100))
            ->withQueryString();

        return InquiryResource::collection($inquiries)->response();
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inquiry::class);

        $days = (int) $request->input('days', 30);
        if (! in_array($days, [7, 30, 90], true)) {
            $days = 30;
        }

        $end = now()->startOfDay()->addDay();
        $start = now()->startOfDay()->subDays($days - 1);
        $previousStart = $start->copy()->subDays($days);

        $visible = Inquiry::query()->visibleTo($request->user());

        $pipeline = (clone $visible)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $dailyRows = (clone $visible)
            ->where('created_at', '>=', $previousStart)
            ->where('created_at', '<', $end)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as aggregate')
            ->groupBy('day')
            ->pluck('aggregate', 'day');

        $daily = [];
        foreach ($dailyRows as $day => $aggregate) {
            $daily[substr((string) $day, 0, 10)] = (int) $aggregate;
        }

        $movement = (clone $visible)
            ->where('status_changed_at', '>=', $previousStart)
            ->where('status_changed_at', '<', $end)
            ->selectRaw(
                'SUM(CASE WHEN status_changed_at >= ? AND status_changed_at < ? AND status IN ("won", "lost") THEN 1 ELSE 0 END) as closed_current,
                 SUM(CASE WHEN status_changed_at >= ? AND status_changed_at < ? AND status IN ("won", "lost") THEN 1 ELSE 0 END) as closed_previous,
                 SUM(CASE WHEN status_changed_at >= ? AND status_changed_at < ? AND status = "pending" THEN 1 ELSE 0 END) as pending_current,
                 SUM(CASE WHEN status_changed_at >= ? AND status_changed_at < ? AND status = "pending" THEN 1 ELSE 0 END) as pending_previous',
                [$start, $end, $previousStart, $start, $start, $end, $previousStart, $start]
            )
            ->first();

        $receivedCurrent = 0;
        $receivedPrevious = 0;
        $series = [];

        for ($offset = 0; $offset < $days; $offset++) {
            $currentDay = $start->copy()->addDays($offset);
            $previousDay = $previousStart->copy()->addDays($offset);
            $currentCount = $daily[$currentDay->toDateString()] ?? 0;
            $previousCount = $daily[$previousDay->toDateString()] ?? 0;
            $receivedCurrent += $currentCount;
            $receivedPrevious += $previousCount;
            $series[] = [
                'label' => $currentDay->format('M j'),
                'current' => $currentCount,
                'previous' => $previousCount,
            ];
        }

        $byStatus = collect(Inquiry::STATUSES)
            ->mapWithKeys(fn (string $status) => [$status => (int) ($pipeline[$status] ?? 0)]);

        return response()->json([
            'days' => $days,
            'total' => (int) $byStatus->sum(),
            'open' => (int) $byStatus->only(Inquiry::OPEN_STATUSES)->sum(),
            'pending' => (int) $byStatus->get('pending', 0),
            'closed' => (int) $byStatus->only(['won', 'lost'])->sum(),
            'by_status' => $byStatus,
            'received' => $this->comparison($receivedCurrent, $receivedPrevious),
            'closures' => $this->comparison((int) ($movement->closed_current ?? 0), (int) ($movement->closed_previous ?? 0)),
            'pending_marked' => $this->comparison((int) ($movement->pending_current ?? 0), (int) ($movement->pending_previous ?? 0)),
            'series' => $series,
        ]);
    }

    /**
     * @return array{current: int, previous: int, growth: float|null}
     */
    private function comparison(int $current, int $previous): array
    {
        $growth = null;

        if ($previous > 0) {
            $growth = round((($current - $previous) / $previous) * 100, 1);
        } elseif ($current === 0) {
            $growth = 0.0;
        }

        return [
            'current' => $current,
            'previous' => $previous,
            'growth' => $growth,
        ];
    }

    public function show(Request $request, Inquiry $inquiry): InquiryResource
    {
        $this->authorize('view', $inquiry);

        $inquiry->load([
            'assignee:id,name,email,role',
            'leadSource:id,name',
            'notes.user:id,name',
            'comments.user:id,name',
            'activities' => fn ($query) => $query->with('user:id,name')->latest('created_at')->limit(50),
            'reminders.user:id,name',
            'attachments',
        ]);

        return new InquiryResource($inquiry);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contact_name' => InputRules::personName(),
            'email' => InputRules::email(),
            'phone' => InputRules::phone(),
            'company' => InputRules::company(),
            'message' => InputRules::prose(),
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'attachment' => ['nullable', 'file', 'max:10240', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $value instanceof \Illuminate\Http\UploadedFile) {
                    $fail('Attach a PDF, Word document, Excel file, or image.');

                    return;
                }

                $extension = strtolower($value->getClientOriginalExtension());
                if (! in_array($extension, self::ATTACHMENT_EXTENSIONS, true)) {
                    $fail('Attach a PDF, Word document, Excel file, or image.');
                }
            }],
        ], [
            'contact_name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'message.required' => 'Message is required.',
            'attachment.max' => 'The attachment must be 10 MB or smaller.',
            ...InputRules::messages(),
        ]);

        $inquiry = Inquiry::query()->create([
            'contact_name' => $data['contact_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company' => $data['company'] ?? null,
            'message' => $data['message'],
            'status' => 'new',
            'lead_source_id' => $data['lead_source_id'] ?? null,
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('inquiries/'.$inquiry->id, config('filesystems.default'));

            $inquiry->attachments()->create([
                'disk' => config('filesystems.default'),
                'path' => $path,
                'original_name' => $this->safeFileName($file->getClientOriginalName(), $file->getClientOriginalExtension()),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        InquiryCreated::dispatch($inquiry);

        $assignee = app(InquiryAssigner::class)->assign($inquiry);
        $logger = app(ActivityLogger::class);
        $logger->log(null, $inquiry, 'inquiry.created', 'Inquiry submitted from the public form.');

        if ($assignee !== null) {
            $logger->log(null, $inquiry, 'inquiry.auto_assigned', 'Auto-assigned to '.$assignee->name.'.', [
                'assigned_to' => $assignee->id,
            ]);
        }

        return response()->json([
            'message' => 'Inquiry submitted.',
            'id' => $inquiry->id,
        ], 201);
    }

    public function update(Request $request, Inquiry $inquiry): InquiryResource
    {
        $this->authorize('update', $inquiry);

        $data = $request->validate([
            'status' => ['sometimes', 'required', 'string', 'in:'.implode(',', Inquiry::STATUSES)],
            'assigned_to' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        if (array_key_exists('assigned_to', $data) && $data['assigned_to'] !== null) {
            $this->assertCanAssign($request->user(), (int) $data['assigned_to']);
        }

        $previousStatus = $inquiry->status;
        $previousAssigneeId = $inquiry->assigned_to;
        $previousAssigneeName = $inquiry->assignee?->name ?? 'Unassigned';

        $inquiry->fill($data)->save();
        $inquiry->load(['assignee', 'leadSource']);

        $logger = app(ActivityLogger::class);

        if (array_key_exists('status', $data) && $data['status'] !== $previousStatus) {
            $logger->log(
                $request->user(),
                $inquiry,
                'inquiry.status_changed',
                'Changed status from '.Inquiry::labelFor($previousStatus).' to '.Inquiry::labelFor($inquiry->status).'.',
                ['from' => $previousStatus, 'to' => $inquiry->status]
            );
        }

        if (array_key_exists('assigned_to', $data) && (int) ($data['assigned_to'] ?? 0) !== (int) ($previousAssigneeId ?? 0)) {
            $nextName = $inquiry->assignee?->name ?? 'Unassigned';
            $logger->log(
                $request->user(),
                $inquiry,
                'inquiry.reassigned',
                'Reassigned from '.$previousAssigneeName.' to '.$nextName.'.',
                ['from' => $previousAssigneeId, 'to' => $inquiry->assigned_to]
            );
        }

        return new InquiryResource($inquiry);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorize('export', Inquiry::class);

        $query = $this->filteredQuery($request)
            ->with(['assignee', 'leadSource'])
            ->orderBy('id');

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'ID',
                'Name',
                'Email',
                'Phone',
                'Company',
                'Status',
                'Assignee',
                'Lead source',
                'Message',
                'Created at',
            ]);

            foreach ($query->cursor() as $inquiry) {
                fputcsv($handle, [
                    $inquiry->id,
                    $inquiry->contact_name,
                    $inquiry->email,
                    $inquiry->phone,
                    $inquiry->company,
                    $inquiry->status,
                    $inquiry->assignee?->name,
                    $inquiry->leadSource?->name,
                    $inquiry->message,
                    optional($inquiry->created_at)->toDateTimeString(),
                ]);
            }

            fclose($handle);
        }, 'inquiries.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function team(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = User::query()->orderBy('name');

        if (! $user->isAdmin()) {
            $query->whereIn('id', $user->teamIds());
        }

        return response()->json([
            'data' => $query->get(['id', 'name', 'email', 'role', 'manager_id']),
        ]);
    }

    private function filteredQuery(Request $request): Builder
    {
        $query = Inquiry::query()->visibleTo($request->user())->search($request->input('search'));

        $status = $request->string('status')->toString();
        if (in_array($status, Inquiry::STATUSES, true)) {
            $query->where('status', $status);
        }

        if ($request->filled('assigned_to') && ctype_digit((string) $request->input('assigned_to'))) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        return $query;
    }

    private function applyListSort(Builder $query, Request $request): Builder
    {
        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->lower()->toString();
        $validSort = in_array($sort, ['name', 'assignee', 'received'], true);

        if (! $validSort) {
            $sort = 'received';
            $direction = 'desc';
        } elseif (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = $sort === 'received' ? 'desc' : 'asc';
        }

        if ($sort === 'name') {
            $query->orderBy('inquiries.contact_name', $direction);
        } elseif ($sort === 'assignee') {
            $query->leftJoin('users as inquiry_assignees', 'inquiry_assignees.id', '=', 'inquiries.assigned_to')
                ->orderByRaw('inquiry_assignees.name is null')
                ->orderBy('inquiry_assignees.name', $direction);
        } else {
            $query->orderBy('inquiries.created_at', $direction);
        }

        return $query->orderBy('inquiries.id', $direction);
    }

    private function safeFileName(string $original, string $extension): string
    {
        $base = pathinfo(str_replace(["\0", '\\'], '', $original), PATHINFO_FILENAME);
        $base = preg_replace('/[^A-Za-z0-9._\- ]/', '', $base) ?: 'attachment';
        $extension = strtolower(preg_replace('/[^a-z0-9]/i', '', $extension) ?? '');

        return $extension === '' ? $base : $base.'.'.$extension;
    }

    private function assertCanAssign(User $user, int $assigneeId): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if (! in_array($assigneeId, $user->teamIds(), true)) {
            abort(422, 'You can only assign inquiries inside your team.');
        }
    }
}
