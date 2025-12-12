<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubmissionResource;
use App\Models\Hackathon;
use App\Models\Submission;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function store(Request $request, Team $team)
    {
        $user = $request->user();
        $hackathon = $team->hackathon;

        if ($team->leader_id !== $user->id) {
            abort(403, 'Only team leader can submit.');
        }

        if (Carbon::now()->greaterThan($hackathon->submission_deadline)) {
            abort(422, 'Submission deadline has passed.');
        }

        if ($team->submission()->exists()) {
            abort(422, 'This team already submitted.');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'github_url' => ['required', 'url'],
            'video_url' => ['required', 'url'],
            'file' => ['nullable', 'file', 'max:10240'],
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = Storage::disk('s3')->putFile('submissions', $request->file('file'));
        }

        $submission = Submission::create([
            'hackathon_id' => $hackathon->id,
            'team_id' => $team->id,
            'title' => $data['title'],
            'description' => $data['description'],
            'github_url' => $data['github_url'],
            'video_url' => $data['video_url'],
            'file_path' => $filePath,
        ]);

        return new SubmissionResource($submission->load('team'));
    }

    public function index(Hackathon $hackathon)
    {
        $submissions = $hackathon->submissions()->with('team')->get();

        return SubmissionResource::collection($submissions);
    }

    public function show(Submission $submission)
    {
        $submission->load('team', 'ratings');

        return new SubmissionResource($submission);
    }
}


