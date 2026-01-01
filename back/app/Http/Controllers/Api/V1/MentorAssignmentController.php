<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hackathon;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MentorAssignmentController extends Controller
{
    // GET potential mentors (users who are NOT participants in this hackathon)
    public function getPotentialMentors(Hackathon $hackathon)
    {
        $user = request()->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential mentors.');
        }

        // Get users who are NOT participants in this hackathon
        $participantIds = DB::table('team_user')
            ->join('teams', 'team_user.team_id', '=', 'teams.id')
            ->where('teams.hackathon_id', $hackathon->id)
            ->pluck('team_user.user_id')
            ->unique()
            ->toArray();

        // Get users who are NOT already mentors for this hackathon
        $existingMentorIds = $hackathon->mentors()->pluck('users.id')->toArray();

        // Combine exclusions
        $excludeIds = array_unique(array_merge($participantIds, $existingMentorIds, [$hackathon->created_by]));

        $potentialMentors = User::whereNotIn('id', $excludeIds)
            ->select('id', 'name', 'email', 'avatar', 'bio')
            ->with('roles:id,name')
            ->paginate(20);

        // Add avatar_url to each mentor
        $potentialMentors->getCollection()->transform(function ($mentor) {
            $mentor->avatar_url = \App\Helpers\AvatarHelper::generateAvatarUrl($mentor->avatar);
            return $mentor;
        });

        return response()->json([
            'potential_mentors' => $potentialMentors,
            'total' => $potentialMentors->total(),
        ]);
    }

    // ASSIGN mentor to teams
    public function assign(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can assign mentors.');
        }

        // Validate input
        $data = $request->validate([
            'team_ids' => ['required', 'array', 'min:1'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'mentor_id' => [
                'required', 
                'integer', 
                'exists:users,id',
                // Custom validation: mentor must not be participant in this hackathon
                function ($attribute, $value, $fail) use ($hackathon) {
                    $isParticipant = DB::table('team_user')
                        ->join('teams', 'team_user.team_id', '=', 'teams.id')
                        ->where('teams.hackathon_id', $hackathon->id)
                        ->where('team_user.user_id', $value)
                        ->exists();
                    
                    if ($isParticipant) {
                        $fail("This user is a participant and cannot be a mentor.");
                    }
                    
                    // Check if user is organizer of this hackathon
                    if ($hackathon->created_by == $value) {
                        $fail("Organizers cannot be mentors for their own hackathon.");
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
            // Add mentor to hackathon_mentors pivot table with pending status if not already
            $existingHackathonMentor = DB::table('hackathon_mentors')
                ->where('hackathon_id', $hackathon->id)
                ->where('user_id', $data['mentor_id'])
                ->first();
            
            if (!$existingHackathonMentor) {
                DB::table('hackathon_mentors')->insert([
                    'hackathon_id' => $hackathon->id,
                    'user_id' => $data['mentor_id'],
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Assign mentor to teams with pending status
            foreach ($teams as $team) {
                $existingTeamMentor = DB::table('team_mentor')
                    ->where('team_id', $team->id)
                    ->where('user_id', $data['mentor_id'])
                    ->first();
                
                if (!$existingTeamMentor) {
                    DB::table('team_mentor')->insert([
                        'team_id' => $team->id,
                        'user_id' => $data['mentor_id'],
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Mentor assigned successfully',
            'mentor_id' => $data['mentor_id'],
            'team_ids' => $data['team_ids'],
            'assigned_at' => now()->toDateTimeString(),
        ]);
    }

    // BULK ASSIGN mentor to category
    public function assignToCategory(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can assign mentors.');
        }

        // Validate input
        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'mentor_ids' => ['required', 'array', 'min:1'],
            'mentor_ids.*' => [
                'integer', 
                'exists:users,id',
                function ($attribute, $value, $fail) use ($hackathon) {
                    $isParticipant = DB::table('team_user')
                        ->join('teams', 'team_user.team_id', '=', 'teams.id')
                        ->where('teams.hackathon_id', $hackathon->id)
                        ->where('team_user.user_id', $value)
                        ->exists();
                    
                    if ($isParticipant) {
                        $fail("User #{$value} is a participant and cannot be a mentor.");
                    }
                }
            ],
        ]);

        // Get all teams in this category for this hackathon
        $teams = Team::where('hackathon_id', $hackathon->id)
                    ->where('category_id', $data['category_id'])
                    ->get();

        if ($teams->isEmpty()) {
            return response()->json([
                'message' => 'No teams found in this category.',
            ], 404);
        }

        // Use transaction
        DB::transaction(function () use ($teams, $data, $hackathon) {
            // Add mentors to hackathon_mentors pivot
            $hackathon->mentors()->syncWithoutDetaching($data['mentor_ids']);
            
            // Assign mentors to all teams in category
            foreach ($teams as $team) {
                $team->mentors()->syncWithoutDetaching($data['mentor_ids']);
            }
        });

        return response()->json([
            'message' => 'Mentors assigned to all teams in category',
            'category_id' => $data['category_id'],
            'mentor_ids' => $data['mentor_ids'],
            'team_count' => $teams->count(),
        ]);
    }

    // REMOVE mentor from teams
    public function remove(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can remove mentors.');
        }

        // Validate input
        $data = $request->validate([
            'team_ids' => ['required', 'array', 'min:1'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'mentor_ids' => ['required', 'array', 'min:1'],
            'mentor_ids.*' => ['integer', 'exists:users,id'],
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

        // Remove mentors from teams
        foreach ($teams as $team) {
            $team->mentors()->detach($data['mentor_ids']);
        }

        // Also remove from hackathon mentors if they're not mentoring any other team
        foreach ($data['mentor_ids'] as $mentorId) {
            $stillMentoring = Team::where('hackathon_id', $hackathon->id)
                ->whereHas('mentors', function ($q) use ($mentorId) {
                    $q->where('users.id', $mentorId);
                })->exists();
            
            if (!$stillMentoring) {
                $hackathon->mentors()->detach($mentorId);
            }
        }

        return response()->json([
            'message' => 'Mentors removed successfully',
            'mentor_ids' => $data['mentor_ids'],
            'team_ids' => $data['team_ids'],
        ]);
    }

    // LIST mentors for a hackathon
    public function listMentors(Hackathon $hackathon)
    {
        $user = request()->user();
        
        // Authorization: organizer, super admin, or mentors themselves
        $isAuthorized = $hackathon->created_by === $user->id || 
                       $user->hasRole('super_admin') ||
                       $hackathon->mentors()->where('users.id', $user->id)->exists();
        
        if (!$isAuthorized) {
            abort(403, 'You cannot view mentors for this hackathon.');
        }

        $mentors = $hackathon->mentors()
            ->withCount(['mentoredTeams' => function ($query) use ($hackathon) {
                $query->where('hackathon_id', $hackathon->id);
            }])
            ->get(['users.id', 'users.name', 'users.email', 'users.avatar', 'users.bio']);

        // Add avatar_url to each mentor
        $mentors = $mentors->map(function ($mentor) {
            $mentor->avatar_url = \App\Helpers\AvatarHelper::generateAvatarUrl($mentor->avatar);
            return $mentor;
        });

        return response()->json([
            'mentors' => $mentors,
            'total' => $mentors->count(),
        ]);
    }
}