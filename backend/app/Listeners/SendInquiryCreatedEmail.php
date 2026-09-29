<?php

namespace App\Listeners;

use App\Events\InquiryCreated;
use App\Mail\InquiryCreatedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendInquiryCreatedEmail implements ShouldQueue
{
    public bool $afterCommit = true;

    public function handle(InquiryCreated $event): void
    {
        $recipient = config('mail.inquiry_notify');

        if (! is_string($recipient) || $recipient === '') {
            return;
        }

        try {
            Mail::to($recipient)->send(new InquiryCreatedMail($event->inquiry));
        } catch (Throwable $exception) {
            Log::error('Inquiry notification email failed.', [
                'inquiry_id' => $event->inquiry->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
