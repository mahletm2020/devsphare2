<?php

namespace App\Listeners;

use App\Events\ResultsPublished;
use App\Services\EmailService;
use App\Models\Team;

class SendResultsPublishedToTeamLeads
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(ResultsPublished $event): void
    {
        $hackathon = $event->hackathon;

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('results_published')) {
            return;
        }

        $hackathonUrl = config('app.url') . '/hackathons/' . $hackathon->id;

        // Get all team leaders
        $teams = Team::where('hackathon_id', $hackathon->id)
            ->with(['leader', 'submission'])
            ->get();

        foreach ($teams as $team) {
            $htmlContent = view('emails.results-published-team-lead', [
                'hackathon' => $hackathon,
                'team' => $team,
                'hackathonUrl' => $hackathonUrl,
                'isWinner' => $team->submission && $team->submission->is_winner,
                'position' => $team->submission ? $team->submission->winner_position : null,
            ])->render();

            $this->emailService->send(
                to: $team->leader->email,
                subject: "Results Published - {$hackathon->title}",
                htmlContent: $htmlContent,
                eventType: 'results_published',
                entityId: $hackathon->id
            );
        }
    }
}




