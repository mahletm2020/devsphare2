# Resend Email Service Setup

This document explains how to set up Resend for email functionality in DevSphere.

## Prerequisites

1. Create a Resend account at [https://resend.com](https://resend.com)
2. Verify your domain or use Resend's test domain for development

## Setup Steps

### 1. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Generate API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "DevSphere Production" or "DevSphere Development")
5. Copy the API key (you won't be able to see it again)

### 3. Add API Key to Backend .env

Add the following to your `back/.env` file:

```env
RESEND_API_KEY=re_your_api_key_here
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=DevSphere
MAIL_ENABLED=true
```

### 4. Configure Email Types (Optional)

By default, only critical emails are enabled. To enable non-critical emails, add these to your `.env`:

```env
# Critical emails (always enabled)
MAIL_ENABLED_VERIFICATION=true
MAIL_ENABLED_PASSWORD_RESET=true
MAIL_ENABLED_SYSTEM_FAILURE=true

# Non-critical emails (disabled by default)
MAIL_ENABLED_TEAM_CREATED=false
MAIL_ENABLED_SUBMISSION_SUBMITTED=false
MAIL_ENABLED_HACKATHON_PUBLISHED=false
MAIL_ENABLED_JUDGE_ASSIGNED=false
MAIL_ENABLED_JUDGING_PERIOD_STARTED=false
MAIL_ENABLED_JUDGING_DEADLINE_REMINDER=false
MAIL_ENABLED_RESULTS_PUBLISHED=false
MAIL_ENABLED_CERTIFICATE_AVAILABLE=false
```

### 5. Run Migration

Run the migration to create the email logs table:

```bash
cd back
php artisan migrate
```

Or if using Docker:

```bash
docker-compose exec backend php artisan migrate
```

## Email Types

### Critical Emails (Always Enabled)
- **Email Verification**: Sent when a user registers
- **Password Reset**: Sent when a user requests password reset
- **System Failure Critical**: Sent to admins when critical system errors occur

### Non-Critical Emails (Can be Disabled)
- **Team Created**: Confirmation when a team is created
- **Submission Submitted**: Confirmation when a submission is submitted
- **Hackathon Published**: Notification to organizer when hackathon is published
- **Judge Assigned**: Notification to judge when assigned to hackathon
- **Judging Period Started**: Notification to judges when judging begins
- **Judging Deadline Reminder**: Reminder to judges before deadline
- **Results Published**: Notifications to participants, team leads, and sponsors
- **Certificate Available**: Notification when certificate is ready

## Features

### Duplicate Prevention
- Emails are logged in the `email_sent_logs` table
- Prevents sending the same email twice within 24 hours
- Uses a unique key based on event type, entity ID, and recipient

### Email Logging
- All email attempts are logged (successful and failed)
- Logs include recipient, subject, event type, and timestamp
- Useful for debugging and auditing

### Frontend Blocking
- Frontend has no email-sending endpoints
- All emails are sent from the backend only
- This ensures security and prevents abuse

## Scheduled Tasks

### Judging Deadline Reminders

The system includes a scheduled command to send judging deadline reminders:

```bash
php artisan emails:judging-deadline-reminders
```

This command:
- Finds hackathons in judging phase with deadlines in the next 24 hours
- Sends reminder emails to all judges
- Prevents duplicate reminders (only one per hackathon per 24 hours)

**To schedule this command**, add to your cron or task scheduler:

```bash
# Run every 6 hours
* */6 * * * cd /path/to/project/back && php artisan emails:judging-deadline-reminders
```

Or use Laravel's task scheduler (already configured in `routes/console.php`).

## Testing

### Test Email Verification
1. Register a new user
2. Check email inbox for verification email
3. Click the verification link

### Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check email inbox for reset link

### Disable All Non-Critical Emails
Set `MAIL_ENABLED=false` in `.env` to disable all emails except critical ones.

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly in `.env`
2. **Check Logs**: Check `storage/logs/laravel.log` for errors
3. **Check Resend Dashboard**: Verify API key is active and not rate-limited
4. **Check Email Type**: Verify the email type is enabled in config

### Duplicate Emails

- The system prevents duplicates within 24 hours
- If you need to resend, wait 24 hours or manually delete the log entry

### Email Templates

Email templates are located in `back/resources/views/emails/`
- Customize templates as needed
- Templates use Blade syntax

## Security Notes

- Never commit `.env` file with API keys
- Use different API keys for development and production
- Rotate API keys periodically
- Monitor Resend dashboard for suspicious activity

