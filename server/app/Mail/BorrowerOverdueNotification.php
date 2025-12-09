<?php

namespace App\Mail;

use App\Models\BorrowTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class BorrowerOverdueNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $transaction;
    public $daysOverdue;

    /**
     * Create a new message instance.
     *
     * @param BorrowTransaction $transaction
     */
    public function __construct(BorrowTransaction $transaction)
    {
        $this->transaction = $transaction;
        $this->daysOverdue = Carbon::today()->diffInDays($transaction->expected_return_date);
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: '⚠️ Overdue Item Reminder - USeP RMD IMS',
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
            view: 'emails.borrower-overdue-notification',
        );
    }
}

