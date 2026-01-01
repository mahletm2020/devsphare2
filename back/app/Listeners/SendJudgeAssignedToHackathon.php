<?php

namespace App\Listeners;

use App\Events\JudgeAssignedToHackathon;
use App\Services\EmailService;

class SendJudgeAssignedToHackathon
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(JudgeAssignedToHackathon $event): void
    {
        $hackathon = $event->hackathon;
        $judge = $event->judge;

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('judge_assigned')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        $htmlContent = view('emails.judge-assigned', [
            'hackathon' => $hackathon,
            'judge' => $judge,
            'hackathonUrl' => $hackathonUrl,
        ])->render();

        $this->emailService->send(
            to: $judge->email,
            subject: "You've Been Assigned as a Judge - {$hackathon->title}",
            htmlContent: $htmlContent,
            eventType: 'judge_assigned',
            entityId: $hackathon->id
        );
    }
}




