<?php

namespace App\Listeners;

use App\Events\SystemFailureCritical;
use App\Services\EmailService;
use App\Models\User;

class SendSystemFailureCritical
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(SystemFailureCritical $event): void
    {
        // Critical emails are always enabled
        // Send to all super admins
        $admins = User::whereHas('roles', function ($query) {
            $query->where('name', 'super_admin');
        })->get();

        $htmlContent = view('emails.system-failure-critical', [
            'message' => $event->message,
            'context' => $event->context,
        ])->render();

        foreach ($admins as $admin) {
            $this->emailService->send(
                to: $admin->email,
                subject: '🚨 Critical System Failure - DevSphere',
                htmlContent: $htmlContent,
                eventType: 'system_failure_critical',
                entityId: null
            );
        }
    }
}




