<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Hackathon;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function store(Request $request, Hackathon $hackathon)
    {   
        $user = $request->user();

        if (Carbon::now()->greaterThan($hackathon->team_deadline)) {
            abort(422, 'Team creation deadline has passed.');
        }

        $data = $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $team = Team::create([
            'hackathon_id' => $hackathon->id,
            'category_id' => $data['category_id'],
            'leader_id' => $user->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $team->members()->attach($user->id);

        return new TeamResource($team->load('members', 'category'));
    }

    public function join(Request $request, Team $team)
    {
        $user = $request->user();
        $hackathon = $team->hackathon;

        if ($team->is_locked) {
            abort(422, 'Team is locked.');
        }

        if (Carbon::now()->greaterThan($hackathon->team_deadline)) {
            abort(422, 'Team join deadline has passed.');
        }

        $max = $hackathon->max_team_size;
        if ($team->members()->count() >= $max) {
            abort(422, 'Team is full.');
        }

        if ($team->members()->where('users.id', $user->id)->exists()) {
            return new TeamResource($team->load('members', 'category'));
        }

        $team->members()->attach($user->id);

        return new TeamResource($team->refresh()->load('members', 'category'));
    }

    public function leave(Request $request, Team $team)
    {
        $user = $request->user();

        if ($team->is_locked) {
            abort(422, 'Team is locked.');
        }

        if ($team->leader_id === $user->id) {
            abort(422, 'Leader cannot leave the team.');
        }

        $team->members()->detach($user->id);

        return response()->json(['message' => 'Left team']);
    }

    public function show(Team $team)
    {
        return new TeamResource($team->load('members', 'category', 'hackathon'));
    }

    public function lock(Request $request, Team $team)
    {
        $user = $request->user();
        $hackathon = $team->hackathon;

        if ($hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $team->update(['is_locked' => true]);

        return new TeamResource($team->refresh());
    }

    public function unlock(Request $request, Team $team)
    {
        $user = $request->user();
        $hackathon = $team->hackathon;

        if ($hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $team->update(['is_locked' => false]);

        return new TeamResource($team->refresh());
    }

        public function forHackathon(Hackathon $hackathon)
    {
        $teams = $hackathon->teams()->with(['category', 'leader', 'mentors', 'judges'])->get();
        return TeamResource::collection($teams);
    }

}


