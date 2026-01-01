<?php

namespace App\Listeners;

use App\Events\CertificateAvailable;
use App\Services\EmailService;

class SendCertificateAvailable
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(CertificateAvailable $event): void
    {
        $certificate = $event->certificate;
        $certificate->load(['user', 'hackathon', 'team', 'submission']);

        // Check if email type is enabled
        if (!$this->emailService->isEmailTypeEnabled('certificate_available')) {
            return;
        }

        $certificateUrl = config('app.url') . '/certificates/' . $certificate->id;

        $htmlContent = view('emails.certificate-available', [
            'certificate' => $certificate,
            'user' => $certificate->user,
            'hackathon' => $certificate->hackathon,
            'certificateUrl' => $certificateUrl,
        ])->render();

        $this->emailService->send(
            to: $certificate->user->email,
            subject: "Your Certificate is Available - {$certificate->hackathon->title}",
            htmlContent: $htmlContent,
            eventType: 'certificate_available',
            entityId: $certificate->id
        );
    }
}




