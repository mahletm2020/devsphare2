<?php

namespace App\Listeners;

use App\Events\TeamCreated;
use App\Services\EmailService;

class SendTeamCreatedConfirmation
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(TeamCreated $event): void
    {
        $team = $event->team;
        $team->load(['hackathon', 'leader', 'members']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('team_created')) {
            return;
        }

        // Send to team leader
        $hackathonUrl = config('app.url') . '/hackathons/' . $team->hackathon->id;

        $htmlContent = view('emails.team-created', [
            'team' => $team,
            'hackathon' => $team->hackathon,
            'hackathonUrl' => $hackathonUrl,
        ])->render();

        $this->emailService->send(
            to: $team->leader->email,
            subject: "Team '{$team->name}' Created Successfully - DevSphere",
            htmlContent: $htmlContent,
            eventType: 'team_created',
            entityId: $team->id
        );
    }
}




