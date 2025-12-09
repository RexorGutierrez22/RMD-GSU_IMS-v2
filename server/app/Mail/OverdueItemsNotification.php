<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class OverdueItemsNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $overdueItems;
    public $totalCount;
    public $totalItems;
    public $totalDaysOverdue;
    public $reportDate;

    /**
     * Create a new message instance.
     *
     * @param array $overdueItems
     * @param int $totalCount
     * @param int $totalItems
     * @param float $totalDaysOverdue Average days overdue
     */
    public function __construct(array $overdueItems, int $totalCount, int $totalItems, float $totalDaysOverdue)
    {
        $this->overdueItems = $overdueItems;
        $this->totalCount = $totalCount;
        $this->totalItems = $totalItems;
        $this->totalDaysOverdue = $totalDaysOverdue;
        $this->reportDate = Carbon::now()->format('F d, Y');
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope()
    {
        return new Envelope(
            subject: "⚠️ Overdue Items Alert - {$this->totalCount} Transaction(s) Require Attention",
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
            view: 'emails.overdue-items-notification',
        );
    }
}

