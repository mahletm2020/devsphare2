<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\StreamChatService;
use App\Models\User;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    private $streamService;

    public function __construct(StreamChatService $streamService)
    {
        $this->streamService = $streamService;
    }

    /**
     * Get Stream Chat token for authenticated user
     */
    public function getToken(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            // Check if Stream Chat is configured
            $apiKey = config('services.stream.api_key');
            $apiSecret = config('services.stream.api_secret');
            
            if (!$apiKey || !$apiSecret) {
                return response()->json([
                    'message' => 'Chat service is not configured',
                    'error' => 'Stream Chat API credentials are not set. Please configure STREAM_API_KEY and STREAM_API_SECRET in your .env file.',
                ], 503); // Service Unavailable
            }
            
            // Update user in Stream Chat to ensure profile is synced
            $this->streamService->updateUser($user);
            
            // Generate token
            $token = $this->streamService->createToken($user);
            
            return response()->json([
                'token' => $token,
                'api_key' => $apiKey,
                'user_id' => $user->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Chat token generation error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to generate chat token',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or get direct message channel between two users
     */
    public function getDirectChannel(Request $request, $userId)
    {
        $currentUser = $request->user();
        $otherUser = User::findOrFail($userId);
        
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $channel = $this->streamService->getOrCreateDirectChannel($currentUser, $otherUser);
            
            // Sort user IDs for consistent channel ID
            $userIds = [(string)$currentUser->id, (string)$otherUser->id];
            sort($userIds);
            $channelId = 'direct-' . implode('-', $userIds);
            
            return response()->json([
                'channel_id' => $channelId,
                'channel_type' => 'messaging',
                'members' => [
                    [
                        'id' => $currentUser->id,
                        'name' => $currentUser->name,
                        'avatar' => $currentUser->avatar,
                    ],
                    [
                        'id' => $otherUser->id,
                        'name' => $otherUser->name,
                        'avatar' => $otherUser->avatar,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create/get channel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or get team channel
     */
    public function getTeamChannel(Request $request, $teamId)
    {
        $user = $request->user();
        $team = Team::with(['members', 'hackathon', 'mentors'])->findOrFail($teamId);
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if user is a member of the team
        $isMember = $team->members->contains('id', $user->id) || $team->leader_id === $user->id;
        
        // Check if user is an accepted mentor with access during mentor assignment period
        $isMentor = false;
        $canMentorAccess = false;
        if ($team->hackathon) {
            $acceptedMentor = $team->mentors->firstWhere('id', $user->id);
            if ($acceptedMentor && $acceptedMentor->pivot->status === 'accepted') {
                $isMentor = true;
                // Check if mentor assignment period is active or before judging starts
                $canMentorAccess = $team->hackathon->canMentorAccess();
            }
        }
        
        if (!$isMember && !($isMentor && $canMentorAccess)) {
            return response()->json(['message' => 'You are not authorized to access this team chat'], 403);
        }

        try {
            // Get all team member IDs
            $memberIds = $team->members->pluck('id')->toArray();
            if ($team->leader_id && !in_array($team->leader_id, $memberIds)) {
                $memberIds[] = $team->leader_id;
            }
            
            // Add accepted mentors to channel members during mentor assignment period
            if ($team->hackathon && $team->hackathon->canMentorAccess()) {
                $acceptedMentorIds = $team->mentors()
                    ->wherePivot('status', 'accepted')
                    ->pluck('users.id')
                    ->toArray();
                $memberIds = array_merge($memberIds, $acceptedMentorIds);
            }
            
            $memberIds[] = $user->id; // Ensure current user is included
            $memberIds = array_unique($memberIds); // Remove duplicates
            
            $channel = $this->streamService->getOrCreateTeamChannel($teamId, $memberIds, $user);
            
            return response()->json([
                'channel_id' => 'team-' . $teamId,
                'channel_type' => 'messaging',
                'team_id' => $teamId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create/get team channel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or get hackathon channel
     */
    public function getHackathonChannel(Request $request, $hackathonId)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // TODO: Add logic to get hackathon members (organizers, sponsors, participants)
        // For now, create channel with current user
        
        try {
            $channel = $this->streamService->getOrCreateHackathonChannel(
                $hackathonId,
                [$user->id],
                $user
            );
            
            return response()->json([
                'channel_id' => 'hackathon-' . $hackathonId,
                'channel_type' => 'messaging',
                'hackathon_id' => $hackathonId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create/get hackathon channel',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}


