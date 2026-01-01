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
use App\Events\SubmissionSubmitted;

class SubmissionController extends Controller
{
    // STORE - Create submission
    public function store(Request $request, Team $team)
    {
        $user = $request->user();
        
        // Eager load hackathon
        $team->load('hackathon');
        $hackathon = $team->hackathon;

        // Authorization: only team leader can submit
        // For solo teams, the leader is the sole participant and can always submit
        if ($team->leader_id !== $user->id) {
            abort(403, 'Only team leader can submit.');
        }

        // For solo teams, leader can always submit (they are the sole participant)
        // Skip member check for solo teams - leader is the only participant
        $isSoloTeam = $team->is_solo;
        
        if (!$isSoloTeam) {
            // For regular teams, check if leader is also a team member
            $isTeamMember = $team->members()->where('users.id', $user->id)->exists();
            if (!$isTeamMember) {
                abort(403, 'You are not a member of this team.');
            }
        }
        // For solo teams, no additional checks needed - leader can submit

        // Timeline validation - use new timeline fields if available
        if (!$hackathon->isSubmissionOpen()) {
            if ($hackathon->submission_end && Carbon::now()->greaterThan($hackathon->submission_end)) {
                abort(422, 'Submission period has ended.');
            } elseif ($hackathon->submission_start && Carbon::now()->lessThan($hackathon->submission_start)) {
                abort(422, 'Submissions have not started yet.');
            } elseif ($hackathon->submission_deadline && Carbon::now()->greaterThan($hackathon->submission_deadline)) {
                // Fallback to old deadline if new timeline not set
                abort(422, 'Submission deadline has passed.');
            } else {
                abort(422, 'Submissions are not currently open.');
            }
        }

        // Check if in submission-judging gap
        if ($hackathon->isInSubmissionJudgingGap()) {
            abort(422, 'Submissions are locked during the gap period before judging starts.');
        }

        // Check if team already submitted
        if ($team->submission()->exists()) {
            abort(422, 'This team already submitted. You can update your submission.');
        }

        // Validate submission data
        // GitHub URL and video URL are required
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'github_url' => ['required', 'url'],
            'video_url' => ['required', 'url'],
            'live_url' => ['nullable', 'url'],
            'readme_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,zip,rar,txt,doc,docx,md'],
            'ppt_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,ppt,pptx'],
        ]);

        // Handle file uploads
        $readmeFilePath = null;
        if ($request->hasFile('readme_file')) {
            $fileName = 'readme_' . $team->id . '_' . time() . '.' . $request->file('readme_file')->extension();
            $readmeFilePath = Storage::disk('public')->putFileAs('submissions', $request->file('readme_file'), $fileName);
        }

        $pptFilePath = null;
        if ($request->hasFile('ppt_file')) {
            $fileName = 'ppt_' . $team->id . '_' . time() . '.' . $request->file('ppt_file')->extension();
            $pptFilePath = Storage::disk('public')->putFileAs('submissions', $request->file('ppt_file'), $fileName);
        }

        // Create submission
        $submission = Submission::create([
            'hackathon_id' => $hackathon->id,
            'team_id' => $team->id,
            'title' => $data['title'],
            'description' => $data['description'],
            'github_url' => $data['github_url'],
            'video_url' => $data['video_url'],
            'live_url' => $data['live_url'] ?? null,
            'file_path' => null, // Keep for backward compatibility
            'readme_file_path' => $readmeFilePath,
            'ppt_file_path' => $pptFilePath,
            'submitted_at' => now(),
        ]);

        // Dispatch SubmissionSubmitted event (triggers email)
        event(new SubmissionSubmitted($submission));

        return new SubmissionResource($submission->load('team'));
    }

    // INDEX - List submissions for hackathon (with authorization)
    public function index(Hackathon $hackathon, Request $request)
    {
        $user = $request->user();
        
        // Authorization logic
        $isOrganizer = $hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $hackathon->mentors()->where('users.id', $user->id)->exists();
        $isSponsor = $hackathon->sponsors()->where('users.id', $user->id)->exists();
        $isResultsPublished = $hackathon->status === 'results_published';
        
        // Check if user is a team member of any team in this hackathon
        $userTeamIds = Team::where('hackathon_id', $hackathon->id)
            ->whereHas('members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->pluck('id');
        $isTeamMember = $userTeamIds->isNotEmpty();
        
        // Check if submission deadline has passed
        $submissionDeadlinePassed = $hackathon->submission_deadline && 
                                    now() > $hackathon->submission_deadline;
        
        // Check if hackathon is in a viewable state
        $hackathonPublished = $hackathon->status === 'published';
        $hackathonJudging = $hackathon->status === 'judging';
        
        // Determine who can see submissions
        // Team members can always see their own team's submissions
        // Organizers, judges, admins can always see
        // Any authenticated user can see submissions for published hackathons (to browse and see what others submitted)
        // Mentors and sponsors can see during judging phase
        // Results are always visible when published
        $canSeeSubmissions = $isOrganizer || $isSuperAdmin || $isJudge || $isTeamMember ||
                            ($isMentor && $hackathonJudging) ||
                            ($isSponsor && $hackathonJudging) ||
                            $hackathonPublished || // Allow viewing for any published hackathon
                            $isResultsPublished;
        
        if (!$canSeeSubmissions) {
            abort(403, 'Submissions are not visible at this time.');
        }

        // Build query based on user role
        $query = $hackathon->submissions()
            ->with(['team:id,name,category_id', 'team.category:id,name', 'ratings'])
            ->withAvg('ratings as average_rating', 'total_score');

        // Filter submissions based on user role
        if ($isJudge && !$isOrganizer && !$isSuperAdmin) {
            // Judges see only assigned teams' submissions
            $assignedTeamIds = $user->judgedTeams()
                ->where('hackathon_id', $hackathon->id)
                ->pluck('teams.id');
            $query->whereIn('team_id', $assignedTeamIds);
        } elseif ($isTeamMember && !$isOrganizer && !$isSuperAdmin && !$isJudge && !$submissionDeadlinePassed && !$isResultsPublished) {
            // Team members see only their own team's submissions (before deadline or results)
            // After deadline or results published, they can see all
            $query->whereIn('team_id', $userTeamIds);
        }
        // For organizers, admins, judges, after submission deadline, or after results published - show all (no filter)
        // Regular users viewing published hackathons will see all submissions (after authorization check passes)

        $submissions = $query->orderByDesc('average_rating')->paginate(20);

        return SubmissionResource::collection($submissions);
    }

    // SHOW - Get single submission
    public function show(Submission $submission)
    {
        $user = request()->user();
        $submission->load(['hackathon', 'team.category', 'team.members:id,name']);
        
        $hackathon = $submission->hackathon;
        
        // Authorization logic
        $isOrganizer = $hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isTeamMember = $submission->team->members()->where('users.id', $user->id)->exists();
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $hackathon->mentors()->where('users.id', $user->id)->exists();
        $isSponsor = $hackathon->sponsors()->where('users.id', $user->id)->exists();
        $isResultsPublished = $hackathon->status === 'results_published';
        
        // Determine who can see submission
        $canSeeSubmission = $isOrganizer || $isSuperAdmin || $isTeamMember || $isJudge || 
                           ($isMentor && $hackathon->status === 'judging') ||
                           ($isSponsor && $hackathon->status === 'judging') ||
                           $isResultsPublished;
        
        if (!$canSeeSubmission) {
            abort(403, 'You cannot view this submission.');
        }
        
        // Load ratings based on who's viewing
        if ($isOrganizer || $isSuperAdmin || $isResultsPublished) {
            $submission->load(['ratings.judge:id,name']);
        } elseif ($isJudge) {
            $submission->load(['ratings' => function ($query) use ($user) {
                $query->where('judge_id', $user->id);
            }]);
        }

        return new SubmissionResource($submission);
    }

    // UPDATE - Update submission (team leader only, before deadline)
    public function update(Request $request, Submission $submission)
    {
        $user = $request->user();
        $submission->load(['hackathon', 'team']);
        
        // Authorization: only team leader can update
        if ($submission->team->leader_id !== $user->id) {
            abort(403, 'Only team leader can update submission.');
        }

        // Timeline validation
        if (Carbon::now()->greaterThan($submission->hackathon->submission_deadline)) {
            abort(422, 'Submission deadline has passed. Cannot update.');
        }

        // Validate update data
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'github_url' => ['sometimes', 'url'],
            'video_url' => ['sometimes', 'url'],
            'live_url' => ['sometimes', 'nullable', 'url'],
            'readme_file' => ['sometimes', 'nullable', 'file', 'max:10240', 'mimes:pdf,zip,rar,txt,doc,docx,md'],
            'ppt_file' => ['sometimes', 'nullable', 'file', 'max:10240', 'mimes:pdf,ppt,pptx'],
        ]);

        // Ensure at least file or one link is provided (if updating submission content)
        // Only validate if user is trying to update content fields
        if ($request->hasAny(['file', 'github_url', 'video_url', 'live_url'])) {
            $hasFile = $request->hasFile('file');
            $hasGithubUrl = isset($data['github_url']);
            $hasVideoUrl = isset($data['video_url']);
            $hasLiveUrl = isset($data['live_url']);
            
            // Check what will exist after update
            $willHaveFile = $hasFile || ($submission->file_path && !$hasFile);
            $willHaveGithubUrl = ($hasGithubUrl && $data['github_url'] !== null) || 
                                (!$hasGithubUrl && $submission->github_url);
            $willHaveVideoUrl = ($hasVideoUrl && $data['video_url'] !== null) || 
                               (!$hasVideoUrl && $submission->video_url);
            $willHaveLiveUrl = ($hasLiveUrl && $data['live_url'] !== null) || 
                              (!$hasLiveUrl && $submission->live_url);
            
            // If removing all content, require at least one new content source
            if (!$willHaveFile && !$willHaveGithubUrl && !$willHaveVideoUrl && !$willHaveLiveUrl) {
                abort(422, 'Submission must have at least a file or one link (GitHub, video, or live URL).');
            }
        }

        // Handle readme file upload if new file provided
        if ($request->hasFile('readme_file')) {
            // Delete old file if exists
            if ($submission->readme_file_path && Storage::disk('public')->exists($submission->readme_file_path)) {
                Storage::disk('public')->delete($submission->readme_file_path);
            }
            
            $fileName = 'readme_' . $submission->team_id . '_' . time() . '.' . $request->file('readme_file')->extension();
            $readmeFilePath = Storage::disk('public')->putFileAs('submissions', $request->file('readme_file'), $fileName);
            $data['readme_file_path'] = $readmeFilePath;
        }

        // Handle PPT file upload if new file provided
        if ($request->hasFile('ppt_file')) {
            // Delete old file if exists
            if ($submission->ppt_file_path && Storage::disk('public')->exists($submission->ppt_file_path)) {
                Storage::disk('public')->delete($submission->ppt_file_path);
            }
            
            $fileName = 'ppt_' . $submission->team_id . '_' . time() . '.' . $request->file('ppt_file')->extension();
            $pptFilePath = Storage::disk('public')->putFileAs('submissions', $request->file('ppt_file'), $fileName);
            $data['ppt_file_path'] = $pptFilePath;
        }

        // Remove file fields from data array (they're handled separately)
        unset($data['readme_file'], $data['ppt_file']);
        
        $submission->update($data);

        return new SubmissionResource($submission->load('team'));
    }

    // DOWNLOAD submission file
    public function download(Submission $submission)
    {
        $user = request()->user();
        $submission->load('hackathon');
        
        // Authorization: similar to show method
        $hackathon = $submission->hackathon;
        $isOrganizer = $hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isTeamMember = $submission->team->members()->where('users.id', $user->id)->exists();
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isResultsPublished = $hackathon->status === 'results_published';
        
        $canDownload = $isOrganizer || $isSuperAdmin || $isTeamMember || $isJudge || $isResultsPublished;
        
        if (!$canDownload) {
            abort(403, 'You cannot download this file.');
        }

        if (!$submission->file_path || !Storage::disk('public')->exists($submission->file_path)) {
            abort(404, 'File not found.');
        }

        return response()->download(storage_path('app/public/' . $submission->file_path));
    }

    // DOWNLOAD README file
    public function downloadReadme(Submission $submission)
    {
        $user = request()->user();
        $submission->load(['hackathon', 'team']);
        
        // Authorization: team members, organizers, judges can download
        $hackathon = $submission->hackathon;
        $isOrganizer = $hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isTeamMember = $submission->team->members()->where('users.id', $user->id)->exists();
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isResultsPublished = $hackathon->status === 'results_published';
        
        $canDownload = $isOrganizer || $isSuperAdmin || $isTeamMember || $isJudge || $isResultsPublished;
        
        if (!$canDownload) {
            abort(403, 'You cannot download this file.');
        }

        if (!$submission->readme_file_path || !Storage::disk('public')->exists($submission->readme_file_path)) {
            abort(404, 'README file not found.');
        }

        return response()->download(storage_path('app/public/' . $submission->readme_file_path));
    }

    // DOWNLOAD PPT file
    public function downloadPpt(Submission $submission)
    {
        $user = request()->user();
        $submission->load(['hackathon', 'team']);
        
        // Authorization: team members, organizers, judges can download
        $hackathon = $submission->hackathon;
        $isOrganizer = $hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isTeamMember = $submission->team->members()->where('users.id', $user->id)->exists();
        $isJudge = $hackathon->judges()->where('users.id', $user->id)->exists();
        $isResultsPublished = $hackathon->status === 'results_published';
        
        $canDownload = $isOrganizer || $isSuperAdmin || $isTeamMember || $isJudge || $isResultsPublished;
        
        if (!$canDownload) {
            abort(403, 'You cannot download this file.');
        }

        if (!$submission->ppt_file_path || !Storage::disk('public')->exists($submission->ppt_file_path)) {
            abort(404, 'PPT file not found.');
        }

        return response()->download(storage_path('app/public/' . $submission->ppt_file_path));
    }
}