<?php

namespace App\Console\Commands;

use App\Events\JudgingDeadlineReminder;
use App\Models\Hackathon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SendJudgingDeadlineReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:judging-deadline-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send reminder emails to judges before judging deadline';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Find hackathons in judging phase with deadline in next 24 hours
        $hackathons = Hackathon::where('status', 'judging')
            ->whereNotNull('judging_deadline')
            ->where('judging_deadline', '>', now())
            ->where('judging_deadline', '<=', now()->addHours(24))
            ->with('judges')
            ->get();

        $count = 0;
        foreach ($hackathons as $hackathon) {
            // Only send one reminder per hackathon (check if already sent)
            $alreadySent = DB::table('email_sent_logs')
                ->where('event_type', 'judging_deadline_reminder')
                ->where('entity_id', $hackathon->id)
                ->where('sent_at', '>', now()->subHours(24))
                ->exists();

            if (!$alreadySent && $hackathon->judges->count() > 0) {
                event(new JudgingDeadlineReminder($hackathon));
                $count++;
            }
        }

        $this->info("Sent {$count} judging deadline reminder(s).");
        return 0;
    }
}

