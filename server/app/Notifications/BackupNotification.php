<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\SlackMessage;
use Illuminate\Notifications\Messages\LogMessage;

class BackupNotification extends Notification
{
    protected $event;

    public function __construct($event)
    {
        $this->event = $event;
    }

    public function via($notifiable)
    {
        // Use log channel for now (writes to Laravel log)
        return ['log'];
    }

    public function toLog($notifiable)
    {
        return [
            'message' => 'Backup event: ' . get_class($this->event),
            'event' => $this->event,
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Backup Notification')
            ->line('A backup event has occurred.');
    }
}

