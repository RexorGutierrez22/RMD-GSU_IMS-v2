<?php

namespace App\Mail;

use App\Models\AdminRegistration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $registration;
    public $verificationCode;

    /**
     * Create a new message instance.
     *
     * @param AdminRegistration $registration
     * @param string $verificationCode
     */
    public function __construct(AdminRegistration $registration, string $verificationCode)
    {
        $this->registration = $registration;
        $this->verificationCode = $verificationCode;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Email Verification - USeP RMD IMS',
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content()
    {
        return new Content(
            view: 'emails.staff-verification',
        );
    }
}

