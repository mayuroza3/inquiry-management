<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function download(Request $request, Inquiry $inquiry, Attachment $attachment): StreamedResponse
    {
        $this->authorize('view', $inquiry);

        abort_unless($attachment->inquiry_id === $inquiry->id, 404);

        return Storage::disk($attachment->disk)->download($attachment->path, $attachment->original_name);
    }
}
