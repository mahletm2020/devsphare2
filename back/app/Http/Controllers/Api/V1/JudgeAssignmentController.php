<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hackathon;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use App\Events\JudgeAssignedToHackathon;

class JudgeAssignmentController extends Controller
{
    // GET potential judges (users who are NOT participants in this hackathon)
    public function getPotentialJudges(Hackathon $hackathon)
    {
        $user = request()->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential judges.');
        }

        // Get users who are NOT participants in this hackathon
        $participantIds = DB::table('team_user')
            ->join('teams', 'team_user.team_id', '=', 'teams.id')
            ->where('teams.hackathon_id', $hackathon->id)
            ->pluck('team_user.user_id')
            ->unique()
            ->toArray();

        // Get users who are NOT already judges for this hackathon
        $existingJudgeIds = $hackathon->judges()->pluck('users.id')->toArray();

        // Combine exclusions
        $excludeIds = array_unique(array_merge($participantIds, $existingJudgeIds, [$hackathon->created_by]));

        $potentialJudges = User::whereNotIn('id', $excludeIds)
            ->select('id', 'name', 'email', 'avatar', 'bio')
            ->with('roles:id,name')
            ->paginate(20);

        // Add avatar_url to each judge
        $potentialJudges->getCollection()->transform(function ($judge) {
            $judge->avatar_url = \App\Helpers\AvatarHelper::generateAvatarUrl($judge->avatar);
            return $judge;
        });

        return response()->json([
            'potential_judges' => $potentialJudges,
            'total' => $potentialJudges->total(),
        ]);
    }

    // ASSIGN judges to teams
    public function assign(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can assign judges.');
        }

        // Validate timeline - judges can only be assigned after submission deadline
        if (Carbon::now()->lessThan($hackathon->submission_deadline)) {
            abort(422, 'Judges can only be assigned after the submission deadline.');
        }

        // Validate input
        $data = $request->validate([
            'team_ids' => ['required', 'array', 'min:1'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'judge_ids' => ['required', 'array', 'min:1'],
            'judge_ids.*' => [
                'integer', 
                'exists:users,id',
                // Custom validation: user must not be participant in this hackathon
                function ($attribute, $value, $fail) use ($hackathon) {
                    $isParticipant = DB::table('team_user')
                        ->join('teams', 'team_user.team_id', '=', 'teams.id')
                        ->where('teams.hackathon_id', $hackathon->id)
                        ->where('team_user.user_id', $value)
                        ->exists();
                    
                    if ($isParticipant) {
                        $fail("This user is a participant and cannot be a judge.");
                    }
                    
                    // Check if user is organizer of this hackathon
                    if ($hackathon->created_by == $value) {
                        $fail("Organizers cannot be judges for their own hackathon.");
                    }
                }
            ],
        ]);

        // Verify teams belong to this hackathon
        $teams = Team::whereIn('id', $data['team_ids'])->get();
        foreach ($teams as $team) {
            if ($team->hackathon_id !== $hackathon->id) {
                return response()->json([
                    'message' => 'One or more teams do not belong to this hackathon.',
                    'invalid_team_id' => $team->id
                ], 422);
            }
        }

        // Use transaction for data integrity
        DB::transaction(function () use ($teams, $data, $hackathon) {
            // Add judges to hackathon_judges pivot table with pending status
            foreach ($data['judge_ids'] as $judgeId) {
                $existingHackathonJudge = DB::table('hackathon_judges')
                    ->where('hackathon_id', $hackathon->id)
                    ->where('user_id', $judgeId)
                    ->first();
                
                if (!$existingHackathonJudge) {
                    DB::table('hackathon_judges')->insert([
                        'hackathon_id' => $hackathon->id,
                        'user_id' => $judgeId,
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            
            // Assign judges to teams with pending status
            foreach ($teams as $team) {
                foreach ($data['judge_ids'] as $judgeId) {
                    $existingTeamJudge = DB::table('team_judge')
                        ->where('team_id', $team->id)
                        ->where('user_id', $judgeId)
                        ->first();
                    
                    if (!$existingTeamJudge) {
                        DB::table('team_judge')->insert([
                            'team_id' => $team->id,
                            'user_id' => $judgeId,
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        });

        // Dispatch JudgeAssignedToHackathon event for each judge
        foreach ($data['judge_ids'] as $judgeId) {
            $judge = User::find($judgeId);
            if ($judge) {
                event(new JudgeAssignedToHackathon($hackathon, $judge));
            }
        }

        return response()->json([
            'message' => 'Judges assigned successfully',
            'judge_ids' => $data['judge_ids'],
            'team_ids' => $data['team_ids'],
            'assigned_at' => now()->toDateTimeString(),
        ]);
    }

    // LIST judges for a hackathon
    public function listJudges(Hackathon $hackathon)
    {
        $user = request()->user();
        
        // Authorization: organizer, super admin, or judges themselves
        $isAuthorized = $hackathon->created_by === $user->id || 
                       $user->hasRole('super_admin') ||
                       $hackathon->judges()->where('users.id', $user->id)->exists();
        
        if (!$isAuthorized) {
            abort(403, 'You cannot view judges for this hackathon.');
        }

        $judges = $hackathon->judges()
            ->withCount(['judgeRatings' => function ($query) use ($hackathon) {
                $query->whereHas('submission', function ($q) use ($hackathon) {
                    $q->where('hackathon_id', $hackathon->id);
                });
            }])
            ->get(['users.id', 'users.name', 'users.email', 'users.avatar']);

        // Add avatar_url to each judge
        $judges = $judges->map(function ($judge) {
            $judge->avatar_url = \App\Helpers\AvatarHelper::generateAvatarUrl($judge->avatar);
            return $judge;
        });

        return response()->json([
            'judges' => $judges,
            'total' => $judges->count(),
        ]);
    }
}