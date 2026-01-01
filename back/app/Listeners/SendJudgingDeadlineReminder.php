<?php

namespace App\Listeners;

use App\Events\JudgingDeadlineReminder;
use App\Services\EmailService;

class SendJudgingDeadlineReminder
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(JudgingDeadlineReminder $event): void
    {
        $hackathon = $event->hackathon;
        $hackathon->load(['judges']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('judging_deadline_reminder')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        // Send to all judges
        foreach ($hackathon->judges as $judge) {
            $htmlContent = view('emails.judging-deadline-reminder', [
                'hackathon' => $hackathon,
                'judge' => $judge,
                'hackathonUrl' => $hackathonUrl,
            ])->render();

            $this->emailService->send(
                to: $judge->email,
                subject: "Judging Deadline Reminder - {$hackathon->title}",
                htmlContent: $htmlContent,
                eventType: 'judging_deadline_reminder',
                entityId: $hackathon->id
            );
        }
    }
}




