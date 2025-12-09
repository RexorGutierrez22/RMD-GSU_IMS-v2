<?php

namespace App\Mail;

use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;

class EmployeeRegistrationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $qrDownloadUrl;
    public $qrCodeBase64;

    /**
     * Create a new message instance.
     *
     * @param Employee $employee
     * @param string $qrDownloadUrl
     */
    public function __construct(Employee $employee, string $qrDownloadUrl)
    {
        $this->employee = $employee;
        $this->qrDownloadUrl = $qrDownloadUrl;

        // Convert QR code to base64 for embedding in email
        if ($employee->qr_code_path && file_exists(public_path($employee->qr_code_path))) {
            $qrPath = public_path($employee->qr_code_path);
            $qrContent = file_get_contents($qrPath);
            $this->qrCodeBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrContent);
        } else {
            $this->qrCodeBase64 = null;
        }
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: 'Registration Successful - USeP RMD IMS',
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
            view: 'emails.employee-registration',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        $attachments = [];

        // Attach QR code as downloadable file
        if ($this->employee->qr_code_path && file_exists(public_path($this->employee->qr_code_path))) {
            $attachments[] = Attachment::fromPath(public_path($this->employee->qr_code_path))
                ->as('QR_Code_' . $this->employee->emp_id . '.svg')
                ->withMime('image/svg+xml');
        }

        return $attachments;
    }
}

