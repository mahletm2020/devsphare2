<?php

namespace App\Listeners;

use App\Events\JudgingPeriodStarted;
use App\Services\EmailService;

class SendJudgingPeriodStarted
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(JudgingPeriodStarted $event): void
    {
        $hackathon = $event->hackathon;
        $hackathon->load(['judges']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('judging_period_started')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        // Send to all judges
        foreach ($hackathon->judges as $judge) {
            $htmlContent = view('emails.judging-period-started', [
                'hackathon' => $hackathon,
                'judge' => $judge,
                'hackathonUrl' => $hackathonUrl,
            ])->render();

            $this->emailService->send(
                to: $judge->email,
                subject: "Judging Period Started - {$hackathon->title}",
                htmlContent: $htmlContent,
                eventType: 'judging_period_started',
                entityId: $hackathon->id
            );
        }
    }
}




