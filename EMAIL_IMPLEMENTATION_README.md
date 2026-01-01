# Email Implementation Documentation

## Overview

DevSphere uses **Resend** as the email service provider to send transactional emails. The email system is built on Laravel's event-driven architecture, using Events and Listeners to handle email sending asynchronously.

## Architecture

### Components

1. **EmailService** (`app/Services/EmailService.php`)
   - Central service for sending emails via Resend API
   - Handles duplicate prevention (24-hour window)
   - Logs all email attempts
   - Supports CC, BCC, and reply-to options

2. **Events** (`app/Events/`)
   - Triggered when specific actions occur in the application
   - Examples: `UserRegistered`, `TeamCreated`, `SubmissionSubmitted`

3. **Listeners** (`app/Listeners/`)
   - Listen to events and send appropriate emails
   - Examples: `SendEmailVerification`, `SendTeamCreatedConfirmation`

4. **EmailSentLog Model** (`app/Models/EmailSentLog.php`)
   - Tracks all email sending attempts
   - Prevents duplicate emails
   - Stores success/failure status

## Setup Instructions

### 1. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Generate API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "DevSphere Production")
5. Copy the API key (you won't be able to see it again)

### 3. Configure Backend Environment

Add the following to your `back/.env` file:

```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here

# Email From Address
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=DevSphere

# Enable/Disable Email Sending
MAIL_ENABLED=true

# Critical Emails (always enabled)
MAIL_ENABLED_VERIFICATION=true
MAIL_ENABLED_PASSWORD_RESET=true
MAIL_ENABLED_SYSTEM_FAILURE=true

# Non-Critical Emails (disabled by default)
MAIL_ENABLED_TEAM_CREATED=false
MAIL_ENABLED_SUBMISSION_SUBMITTED=false
MAIL_ENABLED_HACKATHON_PUBLISHED=false
MAIL_ENABLED_JUDGE_ASSIGNED=false
MAIL_ENABLED_JUDGING_PERIOD_STARTED=false
MAIL_ENABLED_JUDGING_DEADLINE_REMINDER=false
MAIL_ENABLED_RESULTS_PUBLISHED=false
MAIL_ENABLED_CERTIFICATE_AVAILABLE=false
```

### 4. Install Resend Package

The Resend package should already be installed. If not, run:

```bash
cd back
composer require resend/resend-php
```

### 5. Run Migrations

Create the email logs table:

```bash
cd back
php artisan migrate
```

Or if using Docker:

```bash
docker compose exec backend php artisan migrate
```

### 6. Verify Configuration

Check that your configuration is loaded correctly:

```bash
php artisan tinker
>>> config('services.resend.api_key')
>>> config('mail.enabled')
```

## Email Types

### Critical Emails (Always Enabled)

These emails are essential for system functionality and cannot be disabled:

1. **Email Verification** (`email_verification`)
   - Sent when a user registers
   - Contains verification link
   - Event: `UserRegistered`
   - Listener: `SendEmailVerification`

2. **Password Reset** (`password_reset`)
   - Sent when a user requests password reset
   - Contains reset token link
   - Event: `PasswordResetRequested`
   - Listener: `SendPasswordReset`

3. **System Failure Critical** (`system_failure_critical`)
   - Sent to admins when critical system errors occur
   - Contains error details
   - Event: `SystemFailureCritical`
   - Listener: `SendSystemFailureCritical`

### Non-Critical Emails (Can be Disabled)

These emails can be enabled/disabled via configuration:

1. **Team Created** (`team_created`)
   - Sent to team leader when a team is created
   - Event: `TeamCreated`
   - Listener: `SendTeamCreatedConfirmation`

2. **Submission Submitted** (`submission_submitted`)
   - Sent to team members when a submission is made
   - Event: `SubmissionSubmitted`
   - Listener: `SendSubmissionSubmitted`

3. **Hackathon Published** (`hackathon_published`)
   - Sent to organizer when hackathon is published
   - Event: `HackathonPublished`
   - Listener: `SendHackathonPublished`

4. **Judge Assigned** (`judge_assigned`)
   - Sent to judge when assigned to a hackathon
   - Event: `JudgeAssignedToHackathon`
   - Listener: `SendJudgeAssignedToHackathon`

5. **Judging Period Started** (`judging_period_started`)
   - Sent to judges when judging period begins
   - Event: `JudgingPeriodStarted`
   - Listener: `SendJudgingPeriodStarted`

6. **Judging Deadline Reminder** (`judging_deadline_reminder`)
   - Sent to judges before judging deadline
   - Event: `JudgingDeadlineReminder`
   - Listener: `SendJudgingDeadlineReminder`

7. **Results Published** (`results_published`)
   - Sent to participants, team leads, and sponsors when results are published
   - Events: `ResultsPublished`
   - Listeners: 
     - `SendResultsPublishedToParticipants`
     - `SendResultsPublishedToTeamLeads`
     - `SendResultsPublishedToSponsors`

8. **Certificate Available** (`certificate_available`)
   - Sent to participants when certificates are ready
   - Event: `CertificateAvailable`
   - Listener: `SendCertificateAvailable`

## How It Works

### Event-Driven Flow

1. **Action Occurs**: User action triggers an event (e.g., team creation)
2. **Event Dispatched**: Laravel dispatches the event
3. **Listener Triggered**: Registered listener catches the event
4. **Email Service Called**: Listener uses `EmailService` to send email
5. **Email Sent**: Resend API sends the email
6. **Log Created**: Email attempt is logged in `email_sent_logs` table

### Example Flow: Team Creation

```php
// In TeamController
event(new TeamCreated($team));

// Event is dispatched
// Listener SendTeamCreatedConfirmation handles it
// EmailService sends email to team leader
// Email is logged in database
```

## Usage Examples

### Sending Email Manually

```php
use App\Services\EmailService;

$emailService = app(EmailService::class);

$emailService->send(
    to: 'user@example.com',
    subject: 'Welcome to DevSphere',
    htmlContent: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
    eventType: 'custom_email',
    entityId: 123,
    options: [
        'cc' => ['cc@example.com'],
        'reply_to' => 'support@devsphere.com',
    ]
);
```

### Checking if Email Type is Enabled

```php
$emailService = app(EmailService::class);

if ($emailService->isEmailTypeEnabled('team_created')) {
    // Send email
}
```

### Creating a New Email Type

1. **Create Event**:
```php
// app/Events/NewEvent.php
namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

class NewEvent
{
    use Dispatchable;

    public function __construct(public $data)
    {
    }
}
```

2. **Create Listener**:
```php
// app/Listeners/SendNewEmail.php
namespace App\Listeners;

use App\Events\NewEvent;
use App\Services\EmailService;

class SendNewEmail
{
    public function __construct(private EmailService $emailService)
    {
    }

    public function handle(NewEvent $event): void
    {
        if (!$this->emailService->isEmailTypeEnabled('new_email_type')) {
            return;
        }

        $this->emailService->send(
            to: $event->data->email,
            subject: 'New Email Subject',
            htmlContent: '<h1>Email Content</h1>',
            eventType: 'new_email_type',
            entityId: $event->data->id,
        );
    }
}
```

3. **Register in EventServiceProvider**:
```php
// app/Providers/EventServiceProvider.php
protected $listen = [
    NewEvent::class => [
        SendNewEmail::class,
    ],
];
```

4. **Add to Config**:
```php
// config/mail.php
'enabled_types' => [
    'new_email_type' => env('MAIL_ENABLED_NEW_EMAIL_TYPE', false),
],
```

## Duplicate Prevention

The system prevents duplicate emails using a 24-hour window:

- Each email is assigned a unique `duplicate_key` based on:
  - Event type
  - Entity ID
  - Recipient email
- If the same email was sent within 24 hours, it won't be sent again
- This prevents spam and duplicate notifications

## Email Logging

All email attempts are logged in the `email_sent_logs` table:

- `duplicate_key`: Unique identifier for duplicate prevention
- `recipient_email`: Email address
- `subject`: Email subject
- `event_type`: Type of event that triggered the email
- `entity_id`: Related entity ID (user, team, hackathon, etc.)
- `sent_at`: Timestamp
- `success`: Whether email was sent successfully

### Querying Email Logs

```php
use App\Models\EmailSentLog;

// Get all emails sent to a user
EmailSentLog::where('recipient_email', 'user@example.com')->get();

// Get failed emails
EmailSentLog::where('success', false)->get();

// Get emails for a specific event type
EmailSentLog::where('event_type', 'team_created')->get();
```

## Configuration Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | Required |
| `MAIL_FROM_ADDRESS` | From email address | `noreply@devsphere.com` |
| `MAIL_FROM_NAME` | From name | `DevSphere` |
| `MAIL_ENABLED` | Enable/disable all emails | `true` |
| `MAIL_ENABLED_VERIFICATION` | Enable verification emails | `true` |
| `MAIL_ENABLED_PASSWORD_RESET` | Enable password reset emails | `true` |
| `MAIL_ENABLED_SYSTEM_FAILURE` | Enable system failure emails | `true` |
| `MAIL_ENABLED_TEAM_CREATED` | Enable team creation emails | `false` |
| `MAIL_ENABLED_SUBMISSION_SUBMITTED` | Enable submission emails | `false` |
| `MAIL_ENABLED_HACKATHON_PUBLISHED` | Enable hackathon published emails | `false` |
| `MAIL_ENABLED_JUDGE_ASSIGNED` | Enable judge assignment emails | `false` |
| `MAIL_ENABLED_JUDGING_PERIOD_STARTED` | Enable judging period emails | `false` |
| `MAIL_ENABLED_JUDGING_DEADLINE_REMINDER` | Enable deadline reminder emails | `false` |
| `MAIL_ENABLED_RESULTS_PUBLISHED` | Enable results published emails | `false` |
| `MAIL_ENABLED_CERTIFICATE_AVAILABLE` | Enable certificate emails | `false` |

## Troubleshooting

### Emails Not Sending

1. **Check API Key**:
   ```bash
   php artisan tinker
   >>> config('services.resend.api_key')
   ```
   Should return your API key, not null.

2. **Check Email Enabled**:
   ```bash
   >>> config('mail.enabled')
   ```
   Should return `true`.

3. **Check Logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```
   Look for email-related errors.

4. **Check Email Logs Table**:
   ```php
   EmailSentLog::latest()->take(10)->get();
   ```
   Check if emails are being logged and if they're successful.

### Common Issues

**Issue**: "Resend API key not configured"
- **Solution**: Add `RESEND_API_KEY` to your `.env` file

**Issue**: "Duplicate email prevented"
- **Solution**: This is expected behavior. Wait 24 hours or clear the `email_sent_logs` table for testing.

**Issue**: "Email sending disabled"
- **Solution**: Set `MAIL_ENABLED=true` in `.env`

**Issue**: Emails going to spam
- **Solution**: 
  - Verify your domain in Resend
  - Use a verified sender email
  - Check SPF/DKIM records

### Testing Emails

1. **Enable Log Driver** (for testing):
   ```env
   MAIL_MAILER=log
   ```
   Emails will be written to `storage/logs/laravel.log` instead of being sent.

2. **Use Resend Test Domain**:
   - Resend provides a test domain for development
   - Use `delivered@resend.dev` as recipient for testing

3. **Check Email Logs**:
   ```php
   EmailSentLog::where('success', false)->latest()->get();
   ```

## Best Practices

1. **Always Check if Email Type is Enabled**:
   ```php
   if ($emailService->isEmailTypeEnabled('team_created')) {
       // Send email
   }
   ```

2. **Use Events for Email Triggers**:
   - Don't call `EmailService` directly from controllers
   - Dispatch events instead
   - Let listeners handle email sending

3. **Handle Failures Gracefully**:
   - Email failures shouldn't break the main flow
   - Log errors for debugging
   - Consider retry logic for critical emails

4. **Test Email Templates**:
   - Test with different email clients
   - Ensure responsive design
   - Check spam score

5. **Monitor Email Logs**:
   - Regularly check for failed emails
   - Monitor duplicate prevention
   - Track email delivery rates

## File Structure

```
back/
├── app/
│   ├── Events/
│   │   ├── UserRegistered.php
│   │   ├── TeamCreated.php
│   │   ├── SubmissionSubmitted.php
│   │   └── ...
│   ├── Listeners/
│   │   ├── SendEmailVerification.php
│   │   ├── SendTeamCreatedConfirmation.php
│   │   ├── SendSubmissionSubmitted.php
│   │   └── ...
│   ├── Models/
│   │   └── EmailSentLog.php
│   └── Services/
│       └── EmailService.php
├── config/
│   └── mail.php
└── database/
    └── migrations/
        └── 2025_01_01_000001_create_email_sent_logs_table.php
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check Resend dashboard for delivery status
4. Review email logs in database: `email_sent_logs` table

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Laravel Events Documentation](https://laravel.com/docs/events)
- [Laravel Mail Documentation](https://laravel.com/docs/mail)




