<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use App\Models\Hackathon;


class UserController extends Controller
{
    // INDEX - Search users (secured)
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Authorization: organizers, super admins, and team leaders can search
        $isOrganizer = $user->hasRole('organizer');
        $isSuperAdmin = $user->hasRole('super_admin');
        $isTeamLeader = \App\Models\Team::where('leader_id', $user->id)
            ->whereHas('hackathon', function ($q) {
                $q->where('team_deadline', '>', now())
                  ->where('status', 'published');
            })->exists();
        
        if (!$isOrganizer && !$isSuperAdmin && !$isTeamLeader) {
            abort(403, 'Unauthorized to search users.');
        }

        // Validate request
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', Rule::in(Role::pluck('name')->toArray())],
            'skills' => ['nullable', 'string'],
            'willing_judge' => ['nullable', 'boolean'],
            'willing_mentor' => ['nullable', 'boolean'],
            'exclude_hackathon' => ['nullable', 'exists:hackathons,id'],
        ]);

        // Start query
        $query = User::query()
            ->where('is_searchable', true)
            ->with('roles:name')
            ->select(['id', 'name', 'avatar', 'bio', 'is_willing_judge', 'is_willing_mentor']);

        // Add email only for organizers and super admins
        if ($isOrganizer || $isSuperAdmin) {
            $query->addSelect('email');
        }

        // Apply search filters
        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search, $isOrganizer, $isSuperAdmin) {
                $q->where('name', 'like', "%{$search}%");
                // Only search email if user is organizer/super admin
                if ($isOrganizer || $isSuperAdmin) {
                    $q->orWhere('email', 'like', "%{$search}%");
                }
            });
        }

        // Role filter
        if (isset($validated['role'])) {
            $query->whereHas('roles', function($q) use ($validated) {
                $q->where('name', $validated['role']);
            });
        }

        // Skills filter (for V2)
        if (isset($validated['skills'])) {
            $skills = explode(',', $validated['skills']);
            $query->whereHas('skills', function($q) use ($skills) {
                $q->whereIn('name', $skills);
            });
        }

        // Willingness filters
        if (isset($validated['willing_judge'])) {
            $query->where('is_willing_judge', $validated['willing_judge']);
        }

        if (isset($validated['willing_mentor'])) {
            $query->where('is_willing_mentor', $validated['willing_mentor']);
        }

        // Exclude users already in a specific hackathon (for team invitations)
        if (isset($validated['exclude_hackathon'])) {
            $query->whereDoesntHave('teams', function ($q) use ($validated) {
                $q->where('hackathon_id', $validated['exclude_hackathon']);
            });
        }

        // Order and paginate
        $users = $query->orderBy('name')
                       ->orderBy('id')
                       ->paginate(20);

        return response()->json([
            'users' => $users,
            'filters' => $validated,
            'total' => $users->total(),
        ]);
    }

    // PROFILE - Get user profile
    public function profile(User $user)
    {
        $currentUser = request()->user();
        
        // Allow all authenticated users to view any user's profile
        // Email is only shown to self, organizers, or super admins

        $user->load([
            'roles:name',
            'skills',
            'teams' => function ($query) {
                $query->select(['teams.id', 'teams.name', 'teams.hackathon_id'])
                      ->with(['hackathon:id,title,status'])
                      ->whereHas('hackathon', function ($q) {
                          $q->where('status', '!=', 'results_published');
                      })
                      ->limit(5);
            },
            'leadingTeams' => function ($query) {
                $query->select(['id', 'name', 'hackathon_id'])
                      ->with(['hackathon:id,title'])
                      ->limit(5);
            },
        ]);

        $profileData = [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'roles' => $user->roles->pluck('name'),
            'skills' => $user->skills->pluck('name'),
            'is_willing_judge' => $user->is_willing_judge,
            'is_willing_mentor' => $user->is_willing_mentor,
            'active_teams' => $user->teams,
            'leading_teams' => $user->leadingTeams,
            'created_at' => $user->created_at,
        ];

        // Add avatar_url if avatar exists
        if ($user->avatar) {
            $profileData['avatar_url'] = Storage::disk('public')->url($user->avatar);
        }

        // Add email only for self, organizers, or super admins
        if ($currentUser->id === $user->id || 
            $currentUser->hasRole('organizer') || 
            $currentUser->hasRole('super_admin')) {
            $profileData['email'] = $user->email;
        }

        return response()->json($profileData);
    }

    // UPDATE PROFILE - Update user profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif', 'max:2048'], // 2MB max
            'is_searchable' => ['sometimes', 'boolean'],
            'is_willing_judge' => ['sometimes', 'boolean'],
            'is_willing_mentor' => ['sometimes', 'boolean'],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:50'],
        ]);

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if it exists
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            $file = $request->file('avatar');
            $fileName = 'avatar_' . $user->id . '_' . time() . '.' . $file->extension();
            $filePath = Storage::disk('public')->putFileAs('avatars', $file, $fileName);
            $data['avatar'] = $filePath;
        }

        // Update user - build update array with only provided fields
        $updateData = [];
        
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        
        // Bio can be empty string, so check with array_key_exists
        if (array_key_exists('bio', $data)) {
            $updateData['bio'] = $data['bio'] ?? null;
        }
        
        if (isset($data['avatar'])) {
            $updateData['avatar'] = $data['avatar'];
        }
        
        if (isset($data['is_searchable'])) {
            $updateData['is_searchable'] = $data['is_searchable'];
        }
        
        if (isset($data['is_willing_judge'])) {
            $updateData['is_willing_judge'] = $data['is_willing_judge'];
        }
        
        if (isset($data['is_willing_mentor'])) {
            $updateData['is_willing_mentor'] = $data['is_willing_mentor'];
        }
        
        // Only update if there's something to update
        if (!empty($updateData)) {
            $user->update($updateData);
        }

        // Handle skills (V2 implementation)
        if (isset($data['skills'])) {
            // Sync skills - to be implemented with Skills model
            // $user->skills()->sync($skillIds);
        }

        // Reload user with relationships
        $user->refresh();
        $user->load(['roles']);

        // Return avatar URL if it exists
        $userData = $user->toArray();
        if ($user->avatar) {
            try {
                $userData['avatar_url'] = Storage::disk('public')->url($user->avatar);
            } catch (\Exception $e) {
                \Log::warning('Failed to generate avatar URL: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $userData
        ]); 
    }

    // JUDGE PROFILE - Get potential judges
    public function potentialJudges(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        
        // Authorization: organizer or super admin only
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential judges.');
        }

        // Get users who are willing to judge and not already participants
        $judges = User::where('is_willing_judge', true)
            ->whereDoesntHave('teams', function ($q) use ($hackathon) {
                $q->where('hackathon_id', $hackathon->id);
            })
            ->whereDoesntHave('judgeHackathons', function ($q) use ($hackathon) {
                $q->where('hackathon_id', $hackathon->id);
            })
            ->select(['id', 'name', 'email', 'avatar', 'bio'])
            ->with(['roles:name', 'skills:name'])
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'hackathon' => [
                'id' => $hackathon->id,
                'title' => $hackathon->title,
            ],
            'potential_judges' => $judges,
            'total' => $judges->total(),
        ]);
    }

    // MENTOR PROFILE - Get potential mentors
    public function potentialMentors(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        
        // Authorization: organizer or super admin only
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can view potential mentors.');
        }

        // Get users who are willing to mentor and not already participants
        $mentors = User::where('is_willing_mentor', true)
            ->whereDoesntHave('teams', function ($q) use ($hackathon) {
                $q->where('hackathon_id', $hackathon->id);
            })
            ->whereDoesntHave('mentorHackathons', function ($q) use ($hackathon) {
                $q->where('hackathon_id', $hackathon->id);
            })
            ->select(['id', 'name', 'email', 'avatar', 'bio'])
            ->with(['roles:name', 'skills:name'])
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'hackathon' => [
                'id' => $hackathon->id,
                'title' => $hackathon->title,
            ],
            'potential_mentors' => $mentors,
            'total' => $mentors->total(),
        ]);
    }

    // SEARCH - Simple user search for organizers (global users)
    public function search(Request $request)
    {
        $user = $request->user();
        
        // Authorization: organizers and super admins can search
        if (!$user->hasRole('organizer') && !$user->hasRole('super_admin')) {
            abort(403, 'Unauthorized to search users.');
        }

        // Validate request
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'exclude_hackathon' => ['nullable', 'exists:hackathons,id'],
        ]);

        $search = trim($validated['search'] ?? '');
        
        // Return empty results if no search term provided - users only shown when searched
        if (empty($search)) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'per_page' => 20,
                'total' => 0,
                'last_page' => 1,
            ]);
        }

        // Start query - only show participants, exclude super admins
        $query = User::query()
            ->whereHas('roles', function($q) {
                $q->where('name', 'participant');
            })
            ->whereDoesntHave('roles', function($q) {
                $q->where('name', 'super_admin');
            })
            ->with('roles:id,name')
            ->select(['id', 'name', 'email', 'avatar', 'bio']);

        // Apply search filters - substring match (contains search term)
        // Use 'like' for MySQL/MariaDB compatibility (case-insensitive by default)
        $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });

        // Exclude users already in a specific hackathon as participants (for mentor/judge assignment)
        if (isset($validated['exclude_hackathon'])) {
            $query->whereDoesntHave('teams', function ($q) use ($validated) {
                $q->where('hackathon_id', $validated['exclude_hackathon']);
            });
        }

        // Order and paginate
        $users = $query->orderBy('name')
                       ->orderBy('id')
                       ->paginate(20);

        // Add avatar_url to each user
        $users->getCollection()->transform(function ($user) {
            $user->avatar_url = \App\Helpers\AvatarHelper::generateAvatarUrl($user->avatar);
            return $user;
        });

        return response()->json($users);
    }

    // GET ALL USERS BY ROLE (Super Admin only)
    public function getAllByRole(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('super_admin')) {
            abort(403, 'Only super admins can access this endpoint.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['participant', 'sponsor', 'organizer'])],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = User::whereHas('roles', function($q) use ($validated) {
            $q->where('name', $validated['role']);
        })->with('roles:id,name');

        if (isset($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $validated['per_page'] ?? 20;
        $users = $query->orderBy('name')->paginate($perPage);

        return response()->json($users);
    }
}