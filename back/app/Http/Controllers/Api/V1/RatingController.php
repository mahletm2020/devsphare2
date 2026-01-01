<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HackathonResource;
use App\Http\Resources\RatingResource;
use App\Models\Rating;
use App\Models\Submission;
use App\Models\Hackathon; 
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RatingController extends Controller
{
    // STORE - Submit or update rating
    public function storeOrUpdate(Request $request, Submission $submission)
    {
        $user = $request->user();
        
        // Eager load hackathon with submission
        $submission->load('hackathon');
        $hackathon = $submission->hackathon;

        // Authorization: must be an accepted judge for this hackathon
        $isAcceptedJudge = DB::table('hackathon_judges')
            ->where('hackathon_id', $hackathon->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isAcceptedJudge) {
            abort(403, 'You are not an accepted judge for this hackathon.');
        }

        // Timeline validation - use new timeline fields if available, fallback to old deadline
        $now = Carbon::now();
        $isJudgingOpen = false;
        
        // Check new timeline fields first
        if ($hackathon->judging_start && $hackathon->judging_end) {
            $isJudgingOpen = $now->greaterThanOrEqualTo($hackathon->judging_start) && 
                           $now->lessThanOrEqualTo($hackathon->judging_end);
            if (!$isJudgingOpen) {
                if ($now->lessThan($hackathon->judging_start)) {
                    abort(422, 'Judging period has not started yet.');
                } else {
                    abort(422, 'Judging period has ended.');
                }
            }
        } elseif ($hackathon->judging_deadline) {
            // Fallback to old deadline system
            if ($hackathon->status !== 'judging') {
                abort(422, 'Ratings are only allowed during judging phase.');
            }
            if ($now->greaterThan($hackathon->judging_deadline)) {
                abort(422, 'Judging deadline has passed.');
            }
        } else {
            abort(422, 'Judging timeline is not configured for this hackathon.');
        }

        // Validate rating data
        $data = $request->validate([
            'innovation' => ['required', 'integer', 'between:1,10'],
            'execution' => ['required', 'integer', 'between:1,10'],
            'ux_ui' => ['required', 'integer', 'between:1,10'],
            'feasibility' => ['required', 'integer', 'between:1,10'],
            'comments' => ['nullable', 'string', 'max:1000'],
        ]);

        // Calculate total score
        $total = $data['innovation'] + $data['execution'] + $data['ux_ui'] + $data['feasibility'];

        // Create or update rating
        $rating = Rating::updateOrCreate(
            [
                'submission_id' => $submission->id,
                'judge_id' => $user->id,
            ],
            [
                'innovation' => $data['innovation'],
                'execution' => $data['execution'],
                'ux_ui' => $data['ux_ui'],
                'feasibility' => $data['feasibility'],
                'total_score' => $total,
                'comments' => $data['comments'] ?? null,
            ]
        );

        // Update submission average score
        $this->updateSubmissionAverage($submission);

        return new RatingResource($rating->load('judge:id,name'));
    }

    // GET - Check if user has accepted judge assignments (for sidebar check - no timeline filtering)
    public function hasJudgeAssignments(Request $request)
    {
        $user = $request->user();
        
        try {
            // Get all hackathons where user is an accepted judge (regardless of timeline)
            $hasAssignments = Hackathon::whereHas('judges', function ($query) use ($user) {
                    $query->where('users.id', $user->id)
                          ->where('hackathon_judges.status', 'accepted');
                })
                ->exists();
            
            return response()->json([
                'has_assignments' => $hasAssignments,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error checking judge assignments: ' . $e->getMessage());
            return response()->json([
                'has_assignments' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET hackathons where user is a judge
    public function judgeHackathons(Request $request)
    {
        $user = $request->user();
        $now = now();

        try {
            // Get hackathons where user is an accepted judge
            // Filter by timeline: only show hackathons during judging phase
            $hackathons = Hackathon::whereHas('judges', function ($query) use ($user) {
                    $query->where('users.id', $user->id)
                          ->where('hackathon_judges.status', 'accepted');
                })
                ->where(function ($query) use ($now) {
                    // During judging phase (new timeline fields)
                    $query->where(function ($q) use ($now) {
                        $q->whereNotNull('judging_start')
                          ->whereNotNull('judging_end')
                          ->where('judging_start', '<=', $now)
                          ->where('judging_end', '>=', $now);
                    })
                    // OR fallback to old deadline system
                    ->orWhere(function ($q) use ($now) {
                        $q->whereNull('judging_start')
                          ->whereNull('judging_end')
                          ->where('status', 'judging')
                          ->where(function ($deadlineQ) use ($now) {
                              $deadlineQ->whereNull('judging_deadline')
                                        ->orWhere('judging_deadline', '>=', $now);
                          });
                    });
                })
                ->with(['organization:id,name', 'categories:id,hackathon_id,name'])
                ->withCount('submissions')
                ->orderByDesc('judging_deadline')
                ->paginate(10);

            return HackathonResource::collection($hackathons);
        } catch (\Exception $e) {
            \Log::error('Error fetching judge hackathons: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching judge hackathons',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET submissions to rate for a hackathon
    public function submissionsToRate(Hackathon $hackathon)
    {
        $user = request()->user();

        // Authorization: must be an accepted judge for this hackathon
        $isAcceptedJudge = DB::table('hackathon_judges')
            ->where('hackathon_id', $hackathon->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isAcceptedJudge) {
            abort(403, 'You are not an accepted judge for this hackathon.');
        }

        // Get teams assigned to this judge (with accepted status)
        $assignedTeamIds = DB::table('team_judge')
            ->join('teams', 'team_judge.team_id', '=', 'teams.id')
            ->where('team_judge.user_id', $user->id)
            ->where('teams.hackathon_id', $hackathon->id)
            ->where('team_judge.status', 'accepted')
            ->pluck('teams.id');

        // Get submissions from assigned teams
        $submissions = $hackathon->submissions()
            ->whereIn('team_id', $assignedTeamIds)
            ->with([
                'team:id,name,category_id',
                'team.category:id,name',
                'ratings' => function ($query) use ($user) {
                    $query->where('judge_id', $user->id);
                }
            ])
            ->paginate(20);

        return response()->json([
            'hackathon' => [
                'id' => $hackathon->id,
                'title' => $hackathon->title,
                'judging_deadline' => $hackathon->judging_deadline,
            ],
            'submissions' => $submissions,
            'total_to_rate' => $submissions->total(),
            'rated_count' => $submissions->where('has_rating', true)->count(),
        ]);
    }

    // GET my ratings for a hackathon
    public function myRatings(Hackathon $hackathon)
    {
        $user = request()->user();

        // Authorization: must be an accepted judge for this hackathon
        $isAcceptedJudge = DB::table('hackathon_judges')
            ->where('hackathon_id', $hackathon->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isAcceptedJudge) {
            abort(403, 'You are not an accepted judge for this hackathon.');
        }

        $ratings = Rating::where('judge_id', $user->id)
            ->whereHas('submission', function ($query) use ($hackathon) {
                $query->where('hackathon_id', $hackathon->id);
            })
            ->with(['submission.team:id,name'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'hackathon' => [
                'id' => $hackathon->id,
                'title' => $hackathon->title,
            ],
            'ratings' => RatingResource::collection($ratings),
            'total_ratings' => $ratings->total(),
            'average_score' => $ratings->avg('total_score'),
        ]);
    }

    // Helper method to update submission average
    private function updateSubmissionAverage(Submission $submission)
    {
        $averageScore = $submission->ratings()->avg('total_score');
        $ratingCount = $submission->ratings()->count();
        
        $submission->update([
            'average_score' => $averageScore,
            'rating_count' => $ratingCount,
        ]);
    }
}