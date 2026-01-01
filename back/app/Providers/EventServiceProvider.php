<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // User Events
        \App\Events\UserRegistered::class => [
            \App\Listeners\SendEmailVerification::class,
        ],
        \App\Events\PasswordResetRequested::class => [
            \App\Listeners\SendPasswordReset::class,
        ],

        // Team Events
        \App\Events\TeamCreated::class => [
            \App\Listeners\SendTeamCreatedConfirmation::class,
        ],

        // Submission Events
        \App\Events\SubmissionSubmitted::class => [
            \App\Listeners\SendSubmissionSubmitted::class,
        ],

        // Hackathon Events
        \App\Events\HackathonPublished::class => [
            \App\Listeners\SendHackathonPublished::class,
        ],
        \App\Events\JudgeAssignedToHackathon::class => [
            \App\Listeners\SendJudgeAssignedToHackathon::class,
        ],
        \App\Events\JudgingPeriodStarted::class => [
            \App\Listeners\SendJudgingPeriodStarted::class,
        ],
        \App\Events\JudgingDeadlineReminder::class => [
            \App\Listeners\SendJudgingDeadlineReminder::class,
        ],
        \App\Events\ResultsPublished::class => [
            \App\Listeners\SendResultsPublishedToParticipants::class,
            \App\Listeners\SendResultsPublishedToTeamLeads::class,
            \App\Listeners\SendResultsPublishedToSponsors::class,
        ],

        // Certificate Events
        \App\Events\CertificateAvailable::class => [
            \App\Listeners\SendCertificateAvailable::class,
        ],

        // System Events
        \App\Events\SystemFailureCritical::class => [
            \App\Listeners\SendSystemFailureCritical::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
