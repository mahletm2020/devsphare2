<?php

namespace App\Services;

use App\Models\Hackathon;
use App\Models\Submission;
use App\Models\Certificate;
use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class HackathonWinnerService
{
    /**
     * Announce winners for a hackathon
     */
    public function announceWinners(Hackathon $hackathon): void
    {
        // Get top 3 submissions by average_score
        $topSubmissions = Submission::where('hackathon_id', $hackathon->id)
            ->whereNotNull('average_score')
            ->where('average_score', '>', 0)
            ->orderByDesc('average_score')
            ->limit(3)
            ->get();

        if ($topSubmissions->isEmpty()) {
            throw new \Exception('No submissions with scores found for this hackathon.');
        }

        DB::transaction(function () use ($hackathon, $topSubmissions) {
            // Reset all winner flags
            Submission::where('hackathon_id', $hackathon->id)
                ->update([
                    'is_winner' => false,
                    'winner_position' => null,
                ]);

            // Mark winners with positions and create certificates
            foreach ($topSubmissions as $index => $submission) {
                $position = $index + 1;
                $submission->update([
                    'is_winner' => true,
                    'winner_position' => $position,
                ]);
                
                // Load team with members for certificate creation
                $submission->load('team.members');
                
                // Create certificates for each team member
                if ($submission->team) {
                    $members = $submission->team->members;
                    foreach ($members as $member) {
                        Certificate::create([
                            'hackathon_id' => $hackathon->id,
                            'submission_id' => $submission->id,
                            'team_id' => $submission->team_id,
                            'user_id' => $member->id,
                            'winner_position' => $position,
                            'certificate_number' => Certificate::generateCertificateNumber($hackathon->id, $position),
                            'issued_date' => now(),
                            'is_issued' => true,
                        ]);
                    }
                }
            }

            // Update hackathon status to results_published
            $hackathon->update([
                'status' => 'results_published',
                'lifecycle_status' => 'ended',
            ]);

            // Dispatch ResultsPublished event
            event(new \App\Events\ResultsPublished($hackathon));
            
            // Auto-create winner announcement blog post
            $this->createWinnerBlogPost($hackathon, $topSubmissions);
        });
    }

    /**
     * Create winner announcement blog post
     */
    protected function createWinnerBlogPost(Hackathon $hackathon, $topSubmissions): void
    {
        $topSubmissions->load('team');
        
        $winnersList = $topSubmissions->map(function ($submission, $index) {
            $position = $index + 1;
            $positionText = $position === 1 ? '1st Place' : ($position === 2 ? '2nd Place' : '3rd Place');
            return "**{$positionText}**: {$submission->team->name} - {$submission->title} (Score: {$submission->average_score})";
        })->join("\n\n");

        $orgName = $hackathon->organization ? $hackathon->organization->name : ($hackathon->creator ? $hackathon->creator->name : 'Unknown');
        
        $blogContent = "## Hackathon Winners Announcement\n\n";
        $blogContent .= "We are thrilled to announce the winners of **{$hackathon->title}**!\n\n";
        $blogContent .= "### Winners:\n\n";
        $blogContent .= $winnersList;
        $blogContent .= "\n\n";
        $blogContent .= "Congratulations to all the winners and participants for their outstanding work!\n\n";
        $blogContent .= "**Organization**: {$orgName}\n";
        $blogContent .= "**Hackathon Date**: " . ($hackathon->submission_deadline ? $hackathon->submission_deadline->format('F d, Y') : 'TBD');

        $blogTitle = "Winners of {$hackathon->title}";
        $slug = Str::slug($blogTitle);
        $originalSlug = $slug;
        $count = 1;
        while (BlogPost::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        BlogPost::create([
            'author_id' => $hackathon->created_by,
            'hackathon_id' => $hackathon->id,
            'title' => $blogTitle,
            'slug' => $slug,
            'excerpt' => "We are excited to announce the winners of {$hackathon->title}!",
            'content' => $blogContent,
            'type' => 'winner_announcement',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}



