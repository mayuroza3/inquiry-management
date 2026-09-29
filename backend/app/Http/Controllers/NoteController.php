<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoteResource;
use App\Models\Inquiry;
use App\Models\Note;
use App\Services\ActivityLogger;
use App\Support\InputRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function store(Request $request, Inquiry $inquiry): JsonResponse
    {
        return $this->storeEntry($request, $inquiry, Note::KIND_NOTE)
            ->response()
            ->setStatusCode(201);
    }

    public function storeComment(Request $request, Inquiry $inquiry): JsonResponse
    {
        return $this->storeEntry($request, $inquiry, Note::KIND_COMMENT)
            ->response()
            ->setStatusCode(201);
    }

    private function storeEntry(Request $request, Inquiry $inquiry, string $kind): NoteResource
    {
        $this->authorize('update', $inquiry);

        $data = $request->validate([
            'body' => InputRules::prose(),
        ], InputRules::messages());

        $relation = $kind === Note::KIND_COMMENT ? 'comments' : 'notes';
        $entry = $inquiry->{$relation}()->create([
            'user_id' => $request->user()->id,
            'kind' => $kind,
            'body' => $data['body'],
        ]);
        $entry->load('user');

        app(ActivityLogger::class)->log(
            $request->user(),
            $inquiry,
            $kind === Note::KIND_COMMENT ? 'comment.added' : 'note.added',
            $kind === Note::KIND_COMMENT ? 'Added an internal comment.' : 'Added a follow-up note.',
        );

        return new NoteResource($entry);
    }
}
