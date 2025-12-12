<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hackathon;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class JudgeAssignmentController extends Controller
{
    /**
     * Assign judges to multiple teams (team-level assignment).
     *
     * Request body:
     * { "team_ids": [1,2], "judge_ids": [3,4] }
     *
     * Rules:
     *  - Only organizer or super_admin
     *  - Judges can only be assigned after submission_deadline (enforced here)
     */
    public function assign(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        if ($hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Enforce judges assignment only after submission_deadline
        $now = Carbon::now();
        if ($now->lessThan($hackathon->submission_deadline)) {
            return response()->json(['message' => 'Judges can only be assigned after submission deadline'], 422);
        }

        $data = $request->validate([
            'team_ids' => ['required', 'array', 'min:1'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'judge_ids' => ['required', 'array', 'min:1'],
            'judge_ids.*' => ['integer', 'exists:users,id'],
        ]);

        // Ensure teams belong to hackathon
        $teams = Team::whereIn('id', $data['team_ids'])->get();
        foreach ($teams as $team) {
            if ($team->hackathon_id !== $hackathon->id) {
                return response()->json(['message' => 'One or more teams do not belong to this hackathon'], 422);
            }
        }

        // Attach each judge to each team (without detaching others)
        DB::transaction(function () use ($teams, $data) {
            foreach ($teams as $team) {
                $team->judges()->syncWithoutDetaching($data['judge_ids']);
            }
        });

        return response()->json([
            'message' => 'Judges assigned to selected teams',
            'judge_ids' => $data['judge_ids'],
            'team_ids' => $data['team_ids'],
        ]);
    }
}
