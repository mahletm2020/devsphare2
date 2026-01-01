<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Services\EmailService;
use Illuminate\Support\Facades\Log;

class SendEmailVerification
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(UserRegistered $event): void
    {
        $user = $event->user;

        // Skip if email already verified
        if ($user->email_verified_at) {
            return;
        }

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('email_verification')) {
            return;
        }

        $verificationUrl = config('app.url') . '/api/v1/auth/verify-email/' . $user->email_verification_token;

        $htmlContent = view('emails.verification', [
            'user' => $user,
            'verificationUrl' => $verificationUrl,
        ])->render();

        $this->emailService->send(
            to: $user->email,
            subject: 'Verify Your Email Address - DevSphere',
            htmlContent: $htmlContent,
            eventType: 'email_verification',
            entityId: $user->id
        );
    }
}




