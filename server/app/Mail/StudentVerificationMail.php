<?php

namespace App\Mail;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $verificationCode;

    /**
     * Create a new message instance.
     *
     * @param Student $student
     * @param string $verificationCode
     */
    public function __construct(Student $student, string $verificationCode)
    {
        $this->student = $student;
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
            view: 'emails.student-verification',
        );
    }
}
