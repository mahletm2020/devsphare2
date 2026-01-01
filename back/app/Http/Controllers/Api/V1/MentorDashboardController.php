<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MentorDashboardController extends Controller
{
    // GET all teams assigned to current user as mentor
    public function myAssignedTeams(Request $request)
    {
        try {
            $user = $request->user();
            $now = now();
            
            // Get teams where user is an accepted mentor
            // Filter by timeline: only show teams during mentor assignment phase or before judging starts
            $teamsQuery = DB::table('team_mentor')
                ->join('teams', 'team_mentor.team_id', '=', 'teams.id')
                ->join('hackathons', 'teams.hackathon_id', '=', 'hackathons.id')
                ->join('users', 'teams.leader_id', '=', 'users.id')
                ->where('team_mentor.user_id', $user->id)
                ->where('team_mentor.status', 'accepted');
            
            // Simplified timeline filtering: show teams if mentor assignment is active OR judging hasn't started
            $teamsQuery->where(function ($query) use ($now) {
                // During mentor assignment phase
                $query->where(function ($q) use ($now) {
                    $q->whereNotNull('hackathons.mentor_assignment_start')
                      ->whereNotNull('hackathons.mentor_assignment_end')
                      ->where('hackathons.mentor_assignment_start', '<=', $now)
                      ->where('hackathons.mentor_assignment_end', '>=', $now);
                })
                // OR judging hasn't started yet (allows mentors to see teams before judging)
                ->orWhere(function ($q) use ($now) {
                    $q->where(function ($subQ) use ($now) {
                        $subQ->whereNotNull('hackathons.judging_start')
                             ->where('hackathons.judging_start', '>', $now);
                    })
                    ->orWhere(function ($subQ) use ($now) {
                        // Fallback for old hackathons without timeline fields
                        $subQ->whereNull('hackathons.mentor_assignment_end')
                             ->whereNull('hackathons.judging_start')
                             ->where(function ($deadlineQ) use ($now) {
                                 $deadlineQ->whereNull('hackathons.judging_deadline')
                                           ->orWhere('hackathons.judging_deadline', '>', $now);
                             });
                    });
                });
            });
            
            $teams = $teamsQuery
                ->select(
                    'teams.id',
                    'teams.name',
                    'teams.description',
                    'teams.is_locked',
                    'teams.hackathon_id',
                    'teams.leader_id',
                    'hackathons.title as hackathon_title',
                    'hackathons.team_deadline',
                    'hackathons.submission_deadline',
                    'hackathons.judging_deadline',
                    'hackathons.status as hackathon_status',
                    'users.name as leader_name',
                    'users.email as leader_email',
                    'team_mentor.created_at as assigned_at'
                )
                ->get()
                ->map(function ($team) {
                    try {
                        // Load full team model to get relationships
                        $teamModel = Team::with(['members', 'submission', 'hackathon'])->find($team->id);
                        
                        if (!$teamModel) {
                            Log::warning("Team not found: {$team->id}");
                            return null;
                        }
                        
                        $hackathon = $teamModel->hackathon;
                        
                        if (!$hackathon) {
                            Log::warning("Hackathon not found for team: {$team->id}");
                            return null;
                        }
                        
                        $team->members = $teamModel->members->map(function ($member) {
                            return [
                                'id' => $member->id,
                                'name' => $member->name,
                                'email' => $member->email,
                                'avatar_url' => \App\Helpers\AvatarHelper::generateAvatarUrl($member->avatar),
                            ];
                        });
                        
                        $team->member_count = $teamModel->members->count();
                        $team->has_submission = $teamModel->submission !== null;
                        $team->submission = $teamModel->submission;
                        
                        // Add hackathon timeline info for access control
                        $team->hackathon = [
                            'id' => $hackathon->id,
                            'title' => $hackathon->title,
                            'team_deadline' => $hackathon->team_deadline,
                            'submission_deadline' => $hackathon->submission_deadline,
                            'judging_deadline' => $hackathon->judging_deadline,
                            'mentor_assignment_start' => $hackathon->mentor_assignment_start,
                            'mentor_assignment_end' => $hackathon->mentor_assignment_end,
                            'judging_start' => $hackathon->judging_start,
                            'status' => $hackathon->status,
                            'lifecycle_status' => $hackathon->lifecycle_status ?? null,
                        ];
                        
                        return $team;
                    } catch (\Exception $e) {
                        Log::error("Error processing team {$team->id}: " . $e->getMessage(), [
                            'trace' => $e->getTraceAsString()
                        ]);
                        return null;
                    }
                })
                ->filter(); // Remove null entries
            
            return response()->json([
                'teams' => $teams->values(), // Reset keys after filter
                'total' => $teams->count(),
            ]);
        } catch (\Exception $e) {
            Log::error("Error in myAssignedTeams: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'teams' => [],
                'total' => 0,
                'error' => 'Failed to load assigned teams'
            ], 500);
        }
    }
    
    // GET detailed team information
    public function getTeamDetails(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Verify user is an accepted mentor for this team
        $isMentor = DB::table('team_mentor')
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isMentor) {
            abort(403, 'You are not a mentor for this team.');
        }
        
        $team->load(['members', 'submission', 'hackathon', 'leader', 'mentors', 'judges']);
        
        // Format members
        $team->members = $team->members->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'avatar_url' => \App\Helpers\AvatarHelper::generateAvatarUrl($member->avatar),
                'bio' => $member->bio,
            ];
        });
        
        return response()->json([
            'team' => $team,
        ]);
    }
    
    // REMOVE member from team (mentor can remove members)
    public function removeMember(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Verify user is an accepted mentor for this team
        $isMentor = DB::table('team_mentor')
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isMentor) {
            abort(403, 'You are not a mentor for this team.');
        }
        
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);
        
        // Cannot remove the team leader
        if ($team->leader_id === $data['user_id']) {
            abort(422, 'Cannot remove the team leader. Transfer leadership first.');
        }
        
        // Check if user is actually a member
        $isMember = $team->members()->where('users.id', $data['user_id'])->exists();
        if (!$isMember) {
            abort(404, 'User is not a member of this team.');
        }
        
        // Remove member
        $team->members()->detach($data['user_id']);
        
        return response()->json([
            'message' => 'Member removed successfully',
            'team_id' => $team->id,
            'removed_user_id' => $data['user_id'],
        ]);
    }
    
    // TRANSFER LEADERSHIP - Transfer team leadership (mentor can change leader)
    public function transferLeadership(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Verify user is an accepted mentor for this team
        $isMentor = DB::table('team_mentor')
            ->where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->exists();
        
        if (!$isMentor) {
            abort(403, 'You are not a mentor for this team.');
        }

        $data = $request->validate([
            'new_leader_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($team) {
                    // Check if new leader is a team member
                    $isMember = $team->members()->where('users.id', $value)->exists();
                    if (!$isMember) {
                        $fail('The new leader must be a team member.');
                    }
                }
            ],
        ]);

        // Update team leader
        $team->update(['leader_id' => $data['new_leader_id']]);

        // Reload team with relationships
        $team->load(['members', 'submission', 'hackathon', 'leader', 'mentors', 'judges']);
        
        // Format members
        $team->members = $team->members->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'avatar_url' => \App\Helpers\AvatarHelper::generateAvatarUrl($member->avatar),
                'bio' => $member->bio,
            ];
        });

        return response()->json([
            'message' => 'Team leadership transferred successfully',
            'team' => $team,
        ]);
    }
}

