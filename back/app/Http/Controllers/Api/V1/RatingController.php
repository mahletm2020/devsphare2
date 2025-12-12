<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HackathonResource;
use App\Http\Resources\RatingResource;
use App\Models\Rating;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Submission $submission)
    {
        $user = $request->user();
        $hackathon = $submission->hackathon;

        if (! $hackathon->judges()->where('users.id', $user->id)->exists()) {
            abort(403, 'You are not a judge for this hackathon.');
        }

        if ($hackathon->status !== 'judging') {
            abort(422, 'Ratings are only allowed during judging phase.');
        }

        if (Carbon::now()->greaterThan($hackathon->judging_deadline)) {
            abort(422, 'Judging deadline has passed.');
        }

        $data = $request->validate([
            'innovation' => ['required', 'integer', 'between:1,10'],
            'execution' => ['required', 'integer', 'between:1,10'],
            'ux_ui' => ['required', 'integer', 'between:1,10'],
            'feasibility' => ['required', 'integer', 'between:1,10'],
        ]);

        $total = $data['innovation'] + $data['execution'] + $data['ux_ui'] + $data['feasibility'];

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
            ]
        );

        return new RatingResource($rating);
    }

    public function judgeHackathons(Request $request)
    {
        $user = $request->user();

        $hackathons = $user->judgeHackathons()
            ->where('status', 'judging')
            ->with('organization')
            ->get();

        return HackathonResource::collection($hackathons);
    }
}


