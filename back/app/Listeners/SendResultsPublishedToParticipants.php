<?php

namespace App\Listeners;

use App\Events\ResultsPublished;
use App\Services\EmailService;
use App\Models\Team;

class SendResultsPublishedToParticipants
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

        // Get all participants (team members)
        $teams = Team::where('hackathon_id', $hackathon->id)
            ->with(['members', 'submission'])
            ->get();

        foreach ($teams as $team) {
            foreach ($team->members as $member) {
                $htmlContent = view('emails.results-published-participant', [
                    'hackathon' => $hackathon,
                    'team' => $team,
                    'member' => $member,
                    'hackathonUrl' => $hackathonUrl,
                    'isWinner' => $team->submission && $team->submission->is_winner,
                    'position' => $team->submission ? $team->submission->winner_position : null,
                ])->render();

                $this->emailService->send(
                    to: $member->email,
                    subject: "Results Published - {$hackathon->title}",
                    htmlContent: $htmlContent,
                    eventType: 'results_published',
                    entityId: $hackathon->id
                );
            }
        }
    }
}




