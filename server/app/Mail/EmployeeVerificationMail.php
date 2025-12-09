<?php

namespace App\Mail;

use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $verificationCode;

    /**
     * Create a new message instance.
     *
     * @param Employee $employee
     * @param string $verificationCode
     */
    public function __construct(Employee $employee, string $verificationCode)
    {
        $this->employee = $employee;
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
            view: 'emails.employee-verification',
        );
    }
}
