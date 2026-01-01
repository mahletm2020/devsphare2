<?php

namespace App\Listeners;

use App\Events\PasswordResetRequested;
use App\Services\EmailService;

class SendPasswordReset
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(PasswordResetRequested $event): void
    {
        $user = $event->user;
        $token = $event->token;

        // Check if email type is enabled (always enabled for critical emails)
        if (!$this->emailService->isEmailTypeEnabled('password_reset')) {
            return;
        }

        $resetUrl = config('app.url') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

        $htmlContent = view('emails.password-reset', [
            'user' => $user,
            'resetUrl' => $resetUrl,
            'token' => $token,
        ])->render();

        $this->emailService->send(
            to: $user->email,
            subject: 'Reset Your Password - DevSphere',
            htmlContent: $htmlContent,
            eventType: 'password_reset',
            entityId: $user->id
        );
    }
}

