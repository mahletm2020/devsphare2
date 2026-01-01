<?php

namespace App\Listeners;

use App\Events\HackathonPublished;
use App\Services\EmailService;

class SendHackathonPublished
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(HackathonPublished $event): void
    {
        $hackathon = $event->hackathon;
        $hackathon->load(['creator', 'organization']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('hackathon_published')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        $htmlContent = view('emails.hackathon-published', [
            'hackathon' => $hackathon,
            'hackathonUrl' => $hackathonUrl,
        ])->render();

        // Send to organizer
        $this->emailService->send(
            to: $hackathon->creator->email,
            subject: "Hackathon '{$hackathon->title}' Published Successfully - DevSphere",
            htmlContent: $htmlContent,
            eventType: 'hackathon_published',
            entityId: $hackathon->id
        );
    }
}




