<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Hackathon;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Events\TeamCreated;

class TeamController extends Controller
{
    // STORE - Create team
    public function store(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization: participants only, not organizers/sponsors
        if (!$user->hasRole('participant')) {
            abort(403, 'Only participants can create teams.');
        }

        // Check if user is already in a team for this hackathon
        $alreadyInTeam = Team::where('hackathon_id', $hackathon->id)
            ->whereHas('members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->exists();

        if ($alreadyInTeam) {
            abort(422, 'You are already in a team for this hackathon.');
        }

        // Check if user is assigned as judge/mentor for this hackathon
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $hackathon->mentors()->where('users.id', $user->id)->exists();
        
        if ($isJudge || $isMentor) {
            abort(403, 'Judges and mentors cannot participate as team members.');
        }

        // Timeline validation - use new timeline fields if available
        if (!$hackathon->isTeamJoiningOpen()) {
            if ($hackathon->team_joining_end && Carbon::now()->greaterThan($hackathon->team_joining_end)) {
                abort(422, 'Team joining period has ended.');
            } elseif ($hackathon->team_joining_start && Carbon::now()->lessThan($hackathon->team_joining_start)) {
                abort(422, 'Team joining has not started yet.');
            } elseif ($hackathon->team_deadline && Carbon::now()->greaterThan($hackathon->team_deadline)) {
                // Fallback to old deadline if new timeline not set
                abort(422, 'Team creation deadline has passed.');
            } else {
                abort(422, 'Team joining is not currently open.');
            }
        }

        // Check if hackathon has categories
        $hasCategories = $hackathon->categories()->exists();
        
        // Check if this is a solo participation request
        $isSolo = $request->boolean('is_solo', false);
        
        // Validate team data - category_id is required only if hackathon has categories
        $validationRules = [
            'is_solo' => ['sometimes', 'boolean'],
            'name' => [
                $isSolo ? 'nullable' : 'required', // Name optional for solo, required for teams
                'string', 
                'max:255',
                // Unique name per hackathon (only validate if name is provided)
                function ($attribute, $value, $fail) use ($hackathon, $isSolo) {
                    if (!$isSolo && $value) {
                        $exists = Team::where('hackathon_id', $hackathon->id)
                            ->where('name', $value)
                            ->exists();
                        if ($exists) {
                            $fail('This team name is already taken for this hackathon.');
                        }
                    }
                }
            ],
            'description' => ['nullable', 'string', 'max:500'],
        ];

        // Category validation - only required if hackathon has categories and not solo
        if ($hasCategories) {
            $validationRules['category_id'] = [
                $isSolo ? 'nullable' : 'required', // Optional for solo, required for teams
                'exists:categories,id',
                // Check category belongs to this hackathon
                function ($attribute, $value, $fail) use ($hackathon, $isSolo) {
                    if (!$isSolo && $value) {
                        $categoryExists = $hackathon->categories()
                            ->where('id', $value)
                            ->exists();
                        
                        if (!$categoryExists) {
                            $fail('The selected category does not belong to this hackathon.');
                        }
                    }
                }
            ];
        } else {
            // Optional if no categories exist
            $validationRules['category_id'] = ['nullable', 'exists:categories,id'];
        }

        $data = $request->validate($validationRules);

        // Check category capacity only if category_id is provided and categories exist
        if ($hasCategories && isset($data['category_id'])) {
            $category = $hackathon->categories()->find($data['category_id']);
            if ($category && $category->max_teams && $category->teams()->count() >= $category->max_teams) {
                abort(422, 'This category has reached its maximum team capacity.');
            }
        }

        // Create team - category_id can be null if no categories exist
        // For solo teams, use user's name if team name is not provided
        $teamName = $isSolo 
            ? ($data['name'] ?? $user->name . "'s Solo Participation")
            : $data['name'];
        
        $team = Team::create([
            'hackathon_id' => $hackathon->id,
            'category_id' => $data['category_id'] ?? null,
            'leader_id' => $user->id,
            'name' => $teamName,
            'description' => $data['description'] ?? null,
            'is_solo' => $isSolo,
        ]);

        // Add creator as first member
        $team->members()->attach($user->id);

        // Dispatch TeamCreated event (triggers confirmation email)
        event(new TeamCreated($team));

        return new TeamResource($team->load(['members:id,name,avatar', 'category:id,name']));
    }

    // JOIN - Join existing team
    public function join(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Eager load hackathon
        $team->load('hackathon');
        $hackathon = $team->hackathon;

        // Authorization: participants only
        if (!$user->hasRole('participant')) {
            abort(403, 'Only participants can join teams.');
        }

        // Check if team is locked
        if ($team->is_locked) {
            abort(422, 'Team is locked and not accepting new members.');
        }

        // Solo teams cannot have additional members
        if ($team->is_solo) {
            abort(422, 'Solo participants cannot join teams. Create a new team instead.');
        }

        // Check if user is already in a team for this hackathon
        $alreadyInTeam = Team::where('hackathon_id', $hackathon->id)
            ->whereHas('members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->exists();

        if ($alreadyInTeam) {
            abort(422, 'You are already in a team for this hackathon.');
        }

        // Check if user is judge/mentor for this hackathon
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $hackathon->mentors()->where('users.id', $user->id)->exists();
        
        if ($isJudge || $isMentor) {
            abort(403, 'Judges and mentors cannot participate as team members.');
        }

        // Timeline validation - use new timeline fields if available
        if (!$hackathon->isTeamJoiningOpen()) {
            if ($hackathon->team_joining_end && Carbon::now()->greaterThan($hackathon->team_joining_end)) {
                abort(422, 'Team joining period has ended.');
            } elseif ($hackathon->team_joining_start && Carbon::now()->lessThan($hackathon->team_joining_start)) {
                abort(422, 'Team joining has not started yet.');
            } elseif ($hackathon->team_deadline && Carbon::now()->greaterThan($hackathon->team_deadline)) {
                // Fallback to old deadline if new timeline not set
                abort(422, 'Team join deadline has passed.');
            } else {
                abort(422, 'Team joining is not currently open.');
            }
        }

        // Check team size limit
        $max = $hackathon->max_team_size;
        if ($team->members()->count() >= $max) {
            abort(422, 'Team is full.');
        }

        // Check if already a member (idempotent)
        if ($team->members()->where('users.id', $user->id)->exists()) {
            return new TeamResource($team->load(['members:id,name,avatar', 'category:id,name']));
        }

        // Join team
        $team->members()->attach($user->id);

        return new TeamResource($team->refresh()->load(['members:id,name,avatar', 'category:id,name']));
    }

    // LEAVE - Leave team
    public function leave(Request $request, Team $team)
    {
        $user = $request->user();
        $team->load('hackathon');

        // Check if team is locked
        if ($team->is_locked) {
            abort(422, 'Team is locked. Cannot leave.');
        }

        // Check if user is team leader
        if ($team->leader_id === $user->id) {
            abort(422, 'Team leader cannot leave. Transfer leadership first or delete team.');
        }

        // Check if user is a member
        if (!$team->members()->where('users.id', $user->id)->exists()) {
            abort(422, 'You are not a member of this team.');
        }

        // Leave team
        $team->members()->detach($user->id);

        return response()->json([
            'message' => 'Successfully left the team',
            'team_id' => $team->id,
            'team_name' => $team->name,
        ]);
    }

    // SHOW - Get team details
    public function show(Team $team)
    {
        $user = request()->user();
        $team->load(['hackathon', 'category', 'members:id,name,avatar,email', 'leader:id,name,avatar']);
        
        // Authorization: team members, organizers, judges, mentors can always view
        $isMember = $team->members()->where('users.id', $user->id)->exists();
        $isOrganizer = $team->hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isJudge = $team->hackathon->judges()->where('users.id', $user->id)->exists();
        // Check if user is an accepted mentor for THIS specific team
        $isMentor = $team->mentors()->where('users.id', $user->id)->wherePivot('status', 'accepted')->exists();
        
        // Any authenticated user can view teams for published hackathons (to browse and potentially join)
        $hackathonPublished = $team->hackathon->status === 'published';
        
        $canView = $isMember || $isOrganizer || $isSuperAdmin || $isJudge || $isMentor || 
                   $hackathonPublished;
        
        if (!$canView) {
            abort(403, 'You cannot view this team.');
        }
        
        // Load mentors with status for all users (needed for chat access)
        $team->load(['mentors' => function ($query) {
            $query->select('users.id', 'users.name', 'users.avatar')
                  ->withPivot('status');
        }]);
        
        // Load additional data for organizers/judges/mentors
        if ($isOrganizer || $isSuperAdmin || $isJudge || $isMentor) {
            $team->load(['judges:id,name']);
            
            if ($team->submission()->exists()) {
                $team->load(['submission.ratings']);
            }
        }

        return new TeamResource($team);
    }

    // LOCK - Lock team (organizer only)
    public function lock(Request $request, Team $team)
    {
        $user = $request->user();
        $team->load('hackathon');

        // Authorization: organizer or super admin
        if ($team->hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can lock teams.');
        }

        $team->update(['is_locked' => true]);

        // Notify team members (V2)
        // Notification::send($team->members, new TeamLocked($team));

        return new TeamResource($team->refresh()->load(['members:id,name', 'category:id,name']));
    }

    // UNLOCK - Unlock team (organizer only)
    public function unlock(Request $request, Team $team)
    {
        $user = $request->user();
        $team->load('hackathon');

        // Authorization: organizer or super admin
        if ($team->hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can unlock teams.');
        }

        $team->update(['is_locked' => false]);

        return new TeamResource($team->refresh()->load(['members:id,name', 'category:id,name']));
    }

    // FOR HACKATHON - List teams for hackathon
    public function forHackathon(Hackathon $hackathon, Request $request)
    {
        $user = request()->user();
        
        // Authorization: anyone can see teams (or restrict as needed)
        $categoryId = $request->category_id ?? $request->category; // Support both 'category' and 'category_id'
        
        $query = $hackathon->teams()
            ->with([
                'category:id,name',
                'leader:id,name,avatar',
                'members:id,name,avatar',
            ])
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%")
                          ->orWhereHas('leader', function ($leaderQuery) use ($search) {
                              $leaderQuery->where('name', 'like', "%{$search}%");
                          })
                          ->orWhereHas('members', function ($memberQuery) use ($search) {
                              $memberQuery->where('name', 'like', "%{$search}%");
                          })
                          ->orWhereHas('category', function ($categoryQuery) use ($search) {
                              $categoryQuery->where('name', 'like', "%{$search}%");
                          });
                });
            });

        // For organizers/admins, show more info
        if ($hackathon->created_by === $user->id || $user->hasRole('super_admin')) {
            $query->with(['judges:id,name', 'mentors:id,name', 'submission:id,title']);
        }

        return TeamResource::collection($query->paginate(20));
    }

    // TRANSFER LEADERSHIP - Transfer team leadership
    public function transferLeadership(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Authorization: only team leader can transfer leadership
        if ($team->leader_id !== $user->id) {
            abort(403, 'Only team leader can transfer leadership.');
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

        // Notify old and new leaders (V2)
        // Notification::send([$user, User::find($data['new_leader_id'])], new LeadershipTransferred($team));

        return new TeamResource($team->refresh()->load(['leader:id,name', 'members:id,name']));
    }

    // KICK MEMBER - Remove member from team (leader only)
    public function kickMember(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Authorization: only team leader can kick members
        if ($team->leader_id !== $user->id) {
            abort(403, 'Only team leader can remove members.');
        }

        $data = $request->validate([
            'member_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($team, $user) {
                    // Cannot kick yourself
                    if ($value === $user->id) {
                        $fail('You cannot kick yourself. Transfer leadership first.');
                    }
                    
                    // Check if member is in the team
                    $isMember = $team->members()->where('users.id', $value)->exists();
                    if (!$isMember) {
                        $fail('User is not a member of this team.');
                    }
                }
            ],
        ]);

        // Remove member
        $team->members()->detach($data['member_id']);

        // Notify kicked member (V2)
        // Notification::send(User::find($data['member_id']), new MemberKicked($team));

        return response()->json([
            'message' => 'Member removed from team',
            'member_id' => $data['member_id'],
            'team_id' => $team->id,
        ]);
    }
}