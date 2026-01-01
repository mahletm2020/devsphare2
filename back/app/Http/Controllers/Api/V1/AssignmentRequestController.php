<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Hackathon;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssignmentRequestController extends Controller
{
    // GET pending requests for current user (mentor/judge)
    public function myPendingRequests(Request $request)
    {
        $user = $request->user();
        
        // Get pending mentor assignments
        $pendingMentorAssignments = DB::table('team_mentor')
            ->join('teams', 'team_mentor.team_id', '=', 'teams.id')
            ->join('hackathons', 'teams.hackathon_id', '=', 'hackathons.id')
            ->where('team_mentor.user_id', $user->id)
            ->where('team_mentor.status', 'pending')
            ->select(
                'team_mentor.id as assignment_id',
                'team_mentor.team_id',
                'team_mentor.user_id as mentor_id',
                'team_mentor.status',
                'team_mentor.created_at as requested_at',
                'teams.id as team_id',
                'teams.name as team_name',
                'teams.description as team_description',
                'hackathons.id as hackathon_id',
                'hackathons.title as hackathon_title',
                'hackathons.description as hackathon_description',
                'hackathons.team_deadline',
                'hackathons.submission_deadline'
            )
            ->get()
            ->map(function ($assignment) {
                // Get hackathon organizer info
                $hackathon = Hackathon::find($assignment->hackathon_id);
                $assignment->organizer_name = $hackathon->creator->name ?? 'Unknown';
                $assignment->organizer_email = $hackathon->creator->email ?? '';
                
                // Get team details
                $team = Team::with('members')->find($assignment->team_id);
                $assignment->team_members = $team->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                    ];
                }) ?? [];
                
                // Add hackathon and team descriptions
                $assignment->hackathon_description = $hackathon->description ?? null;
                $assignment->team_description = $team->description ?? null;
                
                $assignment->type = 'mentor';
                return $assignment;
            });
        
        // Get pending judge assignments
        $pendingJudgeAssignments = DB::table('team_judge')
            ->join('teams', 'team_judge.team_id', '=', 'teams.id')
            ->join('hackathons', 'teams.hackathon_id', '=', 'hackathons.id')
            ->where('team_judge.user_id', $user->id)
            ->where('team_judge.status', 'pending')
            ->select(
                'team_judge.id as assignment_id',
                'team_judge.team_id',
                'team_judge.user_id as judge_id',
                'team_judge.status',
                'team_judge.created_at as requested_at',
                'teams.id as team_id',
                'teams.name as team_name',
                'teams.description as team_description',
                'hackathons.id as hackathon_id',
                'hackathons.title as hackathon_title',
                'hackathons.description as hackathon_description',
                'hackathons.submission_deadline',
                'hackathons.judging_deadline'
            )
            ->get()
            ->map(function ($assignment) {
                // Get hackathon organizer info
                $hackathon = Hackathon::find($assignment->hackathon_id);
                $assignment->organizer_name = $hackathon->creator->name ?? 'Unknown';
                $assignment->organizer_email = $hackathon->creator->email ?? '';
                
                // Get team details
                $team = Team::with('members')->find($assignment->team_id);
                $assignment->team_members = $team->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                    ];
                }) ?? [];
                
                // Check if team has submission
                $assignment->has_submission = $team->submission()->exists();
                
                // Add hackathon and team descriptions
                $assignment->hackathon_description = $hackathon->description ?? null;
                $assignment->team_description = $team->description ?? null;
                
                $assignment->type = 'judge';
                return $assignment;
            });
        
        return response()->json([
            'mentor_requests' => $pendingMentorAssignments,
            'judge_requests' => $pendingJudgeAssignments,
            'total_mentor_requests' => $pendingMentorAssignments->count(),
            'total_judge_requests' => $pendingJudgeAssignments->count(),
        ]);
    }
    
    // ACCEPT mentor assignment
    public function acceptMentorRequest(Request $request, $assignmentId)
    {
        $user = $request->user();
        
        $assignment = DB::table('team_mentor')
            ->where('id', $assignmentId)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if (!$assignment) {
            abort(404, 'Assignment request not found or already processed.');
        }
        
        $teamId = null;
        DB::transaction(function () use ($assignment, &$teamId) {
            // Update team_mentor status
            DB::table('team_mentor')
                ->where('id', $assignment->id)
                ->update(['status' => 'accepted', 'updated_at' => now()]);
            
            // Update hackathon_mentors status
            $team = Team::find($assignment->team_id);
            $teamId = $team->id;
            DB::table('hackathon_mentors')
                ->where('hackathon_id', $team->hackathon_id)
                ->where('user_id', $assignment->user_id)
                ->update(['status' => 'accepted', 'updated_at' => now()]);
        });
        
        return response()->json([
            'message' => 'Mentor assignment accepted successfully',
            'assignment_id' => $assignmentId,
            'team_id' => $teamId,
        ]);
    }
    
    // REJECT mentor assignment
    public function rejectMentorRequest(Request $request, $assignmentId)
    {
        $user = $request->user();
        
        $assignment = DB::table('team_mentor')
            ->where('id', $assignmentId)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if (!$assignment) {
            abort(404, 'Assignment request not found or already processed.');
        }
        
        DB::transaction(function () use ($assignment) {
            // Update team_mentor status
            DB::table('team_mentor')
                ->where('id', $assignment->id)
                ->update(['status' => 'rejected', 'updated_at' => now()]);
            
            // Remove from hackathon_mentors if no other accepted assignments
            $team = Team::find($assignment->team_id);
            $hasOtherAcceptedAssignments = DB::table('team_mentor')
                ->where('user_id', $assignment->user_id)
                ->where('team_id', '!=', $assignment->team_id)
                ->where('status', 'accepted')
                ->exists();
            
            if (!$hasOtherAcceptedAssignments) {
                DB::table('hackathon_mentors')
                    ->where('hackathon_id', $team->hackathon_id)
                    ->where('user_id', $assignment->user_id)
                    ->update(['status' => 'rejected', 'updated_at' => now()]);
            }
        });
        
        return response()->json([
            'message' => 'Mentor assignment rejected',
            'assignment_id' => $assignmentId,
        ]);
    }
    
    // ACCEPT judge assignment
    public function acceptJudgeRequest(Request $request, $assignmentId)
    {
        $user = $request->user();
        
        $assignment = DB::table('team_judge')
            ->where('id', $assignmentId)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if (!$assignment) {
            abort(404, 'Assignment request not found or already processed.');
        }
        
        DB::transaction(function () use ($assignment) {
            // Update team_judge status
            DB::table('team_judge')
                ->where('id', $assignment->id)
                ->update(['status' => 'accepted', 'updated_at' => now()]);
            
            // Update hackathon_judges status
            $team = Team::find($assignment->team_id);
            DB::table('hackathon_judges')
                ->where('hackathon_id', $team->hackathon_id)
                ->where('user_id', $assignment->user_id)
                ->update(['status' => 'accepted', 'updated_at' => now()]);
        });
        
        return response()->json([
            'message' => 'Judge assignment accepted successfully',
            'assignment_id' => $assignmentId,
        ]);
    }
    
    // REJECT judge assignment
    public function rejectJudgeRequest(Request $request, $assignmentId)
    {
        $user = $request->user();
        
        $assignment = DB::table('team_judge')
            ->where('id', $assignmentId)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();
        
        if (!$assignment) {
            abort(404, 'Assignment request not found or already processed.');
        }
        
        DB::transaction(function () use ($assignment) {
            // Update team_judge status
            DB::table('team_judge')
                ->where('id', $assignment->id)
                ->update(['status' => 'rejected', 'updated_at' => now()]);
            
            // Remove from hackathon_judges if no other accepted assignments
            $team = Team::find($assignment->team_id);
            $hasOtherAcceptedAssignments = DB::table('team_judge')
                ->where('user_id', $assignment->user_id)
                ->where('team_id', '!=', $assignment->team_id)
                ->where('status', 'accepted')
                ->exists();
            
            if (!$hasOtherAcceptedAssignments) {
                DB::table('hackathon_judges')
                    ->where('hackathon_id', $team->hackathon_id)
                    ->where('user_id', $assignment->user_id)
                    ->update(['status' => 'rejected', 'updated_at' => now()]);
            }
        });
        
        return response()->json([
            'message' => 'Judge assignment rejected',
            'assignment_id' => $assignmentId,
        ]);
    }
}

