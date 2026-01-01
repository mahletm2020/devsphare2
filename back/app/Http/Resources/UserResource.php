<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\Hackathon;
use App\Models\User;
use Illuminate\Support\Facades\DB;


class UserResource extends JsonResource
{
    public function search(Request $request)
    {
        $user = $request->user();

        // Only organizers and admins can search users
        if (!$user->hasAnyRole(['organizer', 'super_admin'])) {
            abort(403, 'Unauthorized to search users.');
        }

        $request->validate([
            'search' => 'nullable|string|max:100',
            'exclude_hackathon' => 'nullable|exists:hackathons,id',
            'limit' => 'nullable|integer|min:1|max:100'
        ]);

        $query = User::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        // Exclude users already assigned to this hackathon as mentors/judges
        if ($request->exclude_hackathon) {
            $hackathon = Hackathon::find($request->exclude_hackathon);
            
            // Get IDs of users already assigned as mentors or judges
            $assignedUserIds = collect()
                ->merge($hackathon->mentors()->pluck('users.id'))
                ->merge($hackathon->judges()->pluck('users.id'))
                ->unique();
            
            if ($assignedUserIds->isNotEmpty()) {
                $query->whereNotIn('id', $assignedUserIds);
            }
        }

        $limit = $request->limit ?? 20;
        $users = $query->select('id', 'name', 'email', 'avatar', 'bio')
            ->with('roles:id,name')
            ->paginate($limit);

        return response()->json($users);
    }

    // Get potential mentors for a hackathon
    public function potentialMentors(Hackathon $hackathon, Request $request)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential mentors.');
        }

        $request->validate([
            'search' => 'nullable|string|max:100'
        ]);

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

        $query = User::whereNotIn('id', $excludeIds);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        $users = $query->select('id', 'name', 'email', 'avatar', 'bio')
            ->with('roles:id,name')
            ->paginate(20);

        return response()->json([
            'potential_mentors' => $users,
            'total' => $users->total(),
        ]);
    }

    // Get potential judges for a hackathon
    public function potentialJudges(Hackathon $hackathon, Request $request)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential judges.');
        }

        $request->validate([
            'search' => 'nullable|string|max:100'
        ]);

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

        $query = User::whereNotIn('id', $excludeIds);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        $users = $query->select('id', 'name', 'email', 'avatar', 'bio')
            ->with('roles:id,name')
            ->paginate(20);

        return response()->json([
            'potential_judges' => $users,
            'total' => $users->total(),
        ]);
    }
}