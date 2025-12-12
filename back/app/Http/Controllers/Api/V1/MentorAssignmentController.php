<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hackathon;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MentorAssignmentController extends Controller
{
    public function assign(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        if ($hackathon->created_by !== $user->id && ! $user->hasRole('super_admin')) {
            return response()->json(['message'=>'Unauthorized'],403);
        }

        $data = $request->validate([
            'team_ids' => ['required','array','min:1'],
            'team_ids.*' => ['integer','exists:teams,id'],
            'mentor_id' => ['required','integer','exists:users,id'],
        ]);

        $teams = Team::whereIn('id', $data['team_ids'])->get();
        foreach ($teams as $team) {
            if ($team->hackathon_id !== $hackathon->id) {
                return response()->json(['message'=>'One or more teams do not belong to this hackathon'],422);
            }
        }

        DB::transaction(function () use ($teams, $data) {
            foreach ($teams as $team) {
                $team->mentors()->syncWithoutDetaching([$data['mentor_id']]);
            }
        });

        return response()->json([
            'message' => 'Mentor assigned to selected teams',
            'mentor_id' => $data['mentor_id'],
            'team_ids' => $data['team_ids'],
        ]);
    }
}
