<?php

namespace App\Listeners;

use App\Events\SubmissionSubmitted;
use App\Services\EmailService;

class SendSubmissionSubmitted
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(SubmissionSubmitted $event): void
    {
        $submission = $event->submission;
        $submission->load(['team', 'hackathon', 'team.members', 'team.leader']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('submission_submitted')) {
            return;
        }

        $submissionUrl = config('app.url') . '/hackathons/' . $submission->hackathon->id . '/submissions/' . $submission->id;

        $htmlContent = view('emails.submission-submitted', [
            'submission' => $submission,
            'team' => $submission->team,
            'hackathon' => $submission->hackathon,
            'submissionUrl' => $submissionUrl,
        ])->render();

        // Send to team leader
        $this->emailService->send(
            to: $submission->team->leader->email,
            subject: "Submission '{$submission->title}' Submitted Successfully - DevSphere",
            htmlContent: $htmlContent,
            eventType: 'submission_submitted',
            entityId: $submission->id
        );
    }
}




