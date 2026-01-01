<?php

namespace App\Listeners;

use App\Events\ResultsPublished;
use App\Services\EmailService;

class SendResultsPublishedToSponsors
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(ResultsPublished $event): void
    {
        $hackathon = $event->hackathon;
        $hackathon->load(['sponsors']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('results_published')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        // Send to all sponsors
        foreach ($hackathon->sponsors as $sponsor) {
            $htmlContent = view('emails.results-published-sponsor', [
                'hackathon' => $hackathon,
                'sponsor' => $sponsor,
                'hackathonUrl' => $hackathonUrl,
            ])->render();

            $this->emailService->send(
                to: $sponsor->email,
                subject: "Results Published - {$hackathon->title}",
                htmlContent: $htmlContent,
                eventType: 'results_published',
                entityId: $hackathon->id
            );
        }
    }
}




