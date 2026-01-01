<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Hackathon;
use App\Services\HackathonWinnerService;

class UpdateHackathonLifecycleStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hackathons:update-lifecycle-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update hackathon lifecycle statuses based on timeline and auto-announce winners';

    /**
     * Execute the console command.
     */
    public function handle(HackathonWinnerService $winnerService)
    {
        $this->info('Updating hackathon lifecycle statuses...');

        $hackathons = Hackathon::where('status', '!=', 'draft')
            ->whereNotNull('team_joining_start')
            ->get();

        $updated = 0;
        $announced = 0;

        foreach ($hackathons as $hackathon) {
            $oldStatus = $hackathon->lifecycle_status;
            $hackathon->updateLifecycleStatus();
            
            if ($oldStatus !== $hackathon->lifecycle_status) {
                $updated++;
                $this->line("Updated hackathon '{$hackathon->title}' from {$oldStatus} to {$hackathon->lifecycle_status}");
            }

            // Auto-announce winners if it's time
            if ($hackathon->winner_announcement_time && 
                now()->greaterThanOrEqualTo($hackathon->winner_announcement_time) &&
                $hackathon->status !== 'results_published') {
                try {
                    $winnerService->announceWinners($hackathon);
                    $announced++;
                    $this->info("Auto-announced winners for '{$hackathon->title}'");
                } catch (\Exception $e) {
                    $this->error("Failed to announce winners for '{$hackathon->title}': " . $e->getMessage());
                }
            }
        }

        $this->info("Updated {$updated} hackathon(s). Auto-announced winners for {$announced} hackathon(s).");
        
        return Command::SUCCESS;
    }
}
