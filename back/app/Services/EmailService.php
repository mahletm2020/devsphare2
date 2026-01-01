<?php

namespace App\Services;

use App\Models\EmailSentLog;
use Illuminate\Support\Facades\Log;
use Resend\Resend;
use Resend\Exceptions\ResendException;

class EmailService
{
    private $resend;
    private $fromEmail;
    private $fromName;
    private $enabled;

    public function __construct()
    {
        $apiKey = config('services.resend.api_key');
        $this->fromEmail = config('mail.from.address', 'noreply@devsphere.com');
        $this->fromName = config('mail.from.name', 'DevSphere');
        $this->enabled = config('mail.enabled', true);

        if ($apiKey) {
            $this->resend = new Resend($apiKey);
        }
    }

    /**
     * Send an email using Resend
     *
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlContent HTML email content
     * @param string $eventType Type of event (for duplicate prevention)
     * @param int|null $entityId Related entity ID (user, team, hackathon, etc.)
     * @param array $options Additional options (cc, bcc, reply_to, etc.)
     * @return bool
     */
    public function send(
        string $to,
        string $subject,
        string $htmlContent,
        string $eventType,
        ?int $entityId = null,
        array $options = []
    ): bool {
        // Check if emails are disabled
        if (!$this->enabled) {
            Log::info('Email sending disabled', [
                'to' => $to,
                'event_type' => $eventType,
                'entity_id' => $entityId,
            ]);
            return false;
        }

        // Check if API key is configured
        if (!$this->resend) {
            Log::error('Resend API key not configured');
            return false;
        }

        // Check for duplicate email (prevent sending same email twice)
        $duplicateKey = $this->generateDuplicateKey($eventType, $entityId, $to);
        if ($this->isDuplicate($duplicateKey)) {
            Log::info('Duplicate email prevented', [
                'to' => $to,
                'event_type' => $eventType,
                'entity_id' => $entityId,
            ]);
            return false;
        }

        try {
            $params = [
                'from' => "{$this->fromName} <{$this->fromEmail}>",
                'to' => [$to],
                'subject' => $subject,
                'html' => $htmlContent,
            ];

            // Add optional parameters
            if (isset($options['cc'])) {
                $params['cc'] = is_array($options['cc']) ? $options['cc'] : [$options['cc']];
            }
            if (isset($options['bcc'])) {
                $params['bcc'] = is_array($options['bcc']) ? $options['bcc'] : [$options['bcc']];
            }
            if (isset($options['reply_to'])) {
                $params['reply_to'] = $options['reply_to'];
            }

            $result = $this->resend->emails->send($params);

            // Log successful send
            $this->logEmailSent($duplicateKey, $to, $subject, $eventType, $entityId, true);

            Log::info('Email sent successfully', [
                'to' => $to,
                'event_type' => $eventType,
                'email_id' => $result->id ?? null,
            ]);

            return true;
        } catch (ResendException $e) {
            // Log failed send
            $this->logEmailSent($duplicateKey, $to, $subject, $eventType, $entityId, false);

            Log::error('Failed to send email via Resend', [
                'to' => $to,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Unexpected error sending email', [
                'to' => $to,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Generate a unique key for duplicate prevention
     */
    private function generateDuplicateKey(string $eventType, ?int $entityId, string $to): string
    {
        return md5("{$eventType}:{$entityId}:{$to}");
    }

    /**
     * Check if email was already sent (duplicate prevention)
     */
    private function isDuplicate(string $duplicateKey): bool
    {
        return EmailSentLog::where('duplicate_key', $duplicateKey)
            ->where('sent_at', '>', now()->subHours(24)) // Prevent duplicates within 24 hours
            ->exists();
    }

    /**
     * Log email send attempt
     */
    private function logEmailSent(
        string $duplicateKey,
        string $to,
        string $subject,
        string $eventType,
        ?int $entityId,
        bool $success
    ): void {
        EmailSentLog::create([
            'duplicate_key' => $duplicateKey,
            'recipient_email' => $to,
            'subject' => $subject,
            'event_type' => $eventType,
            'entity_id' => $entityId,
            'sent_at' => now(),
            'success' => $success,
        ]);
    }

    /**
     * Check if a specific email type is enabled
     */
    public function isEmailTypeEnabled(string $emailType): bool
    {
        // Critical emails are always enabled
        $criticalEmails = [
            'email_verification',
            'password_reset',
            'system_failure_critical',
        ];

        if (in_array($emailType, $criticalEmails)) {
            return true;
        }

        // Check config for non-critical emails
        return config("mail.enabled_types.{$emailType}", false);
    }
}




