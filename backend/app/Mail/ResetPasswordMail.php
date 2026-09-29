<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $email,
        public string $token,
        public string $resetUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password reset request for '.$this->email,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.reset-password',
            with: [
                'email' => $this->email,
                'resetUrl' => $this->resetUrl,
            ]
        );
    }
}
