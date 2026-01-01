<?php

namespace App\Services;

use GetStream\StreamChat\Client;
use GetStream\StreamChat\Channel;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Helpers\AvatarHelper;

class StreamChatService
{
    private $client;
    private $apiKey;
    private $apiSecret;

    public function __construct()
    {
        $this->apiKey = config('services.stream.api_key');
        $this->apiSecret = config('services.stream.api_secret');
        
        // Don't throw error in constructor - check in methods instead
        // This allows the service to be instantiated even if credentials aren't set
        if ($this->apiKey && $this->apiSecret) {
            $this->client = new Client($this->apiKey, $this->apiSecret);
        }
    }
    
    private function ensureClient()
    {
        if (!$this->client) {
            if (!$this->apiKey || !$this->apiSecret) {
                throw new \Exception('Stream Chat API credentials not configured. Please set STREAM_API_KEY and STREAM_API_SECRET in your .env file.');
            }
            $this->client = new Client($this->apiKey, $this->apiSecret);
        }
        return $this->client;
    }

    /**
     * Generate a user token for Stream Chat
     *
     * @param User $user
     * @return string
     */
    public function createToken(User $user): string
    {
        try {
            $client = $this->ensureClient();
            return $client->createToken($user->id);
        } catch (\Exception $e) {
            Log::error('Stream Chat token generation failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create or get a channel for two users (1-on-1 chat)
     *
     * @param User $user1
     * @param User $user2
     * @return Channel
     */
    public function getOrCreateDirectChannel(User $user1, User $user2): Channel
    {
        $client = $this->ensureClient();
        // Sort user IDs to ensure consistent channel ID
        $userIds = [$user1->id, $user2->id];
        sort($userIds);
        
        $channelId = 'direct-' . implode('-', $userIds);
        
        try {
            $channel = $client->channel('messaging', $channelId, [
                'members' => [$user1->id, $user2->id],
                'created_by_id' => $user1->id,
            ]);
            
            // Try to create the channel (will return existing if already exists)
            $channel->create($user1->id);
            
            return $channel;
        } catch (\Exception $e) {
            Log::error('Stream Chat channel creation failed', [
                'channel_id' => $channelId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create or get a team channel (group chat)
     *
     * @param int $teamId
     * @param array $memberIds
     * @param User $createdBy
     * @return Channel
     */
    public function getOrCreateTeamChannel(int $teamId, array $memberIds, User $createdBy): Channel
    {
        $client = $this->ensureClient();
        $channelId = 'team-' . $teamId;
        
        try {
            $channel = $client->channel('messaging', $channelId, [
                'members' => $memberIds,
                'created_by_id' => $createdBy->id,
                'name' => 'Team Chat',
            ]);
            
            // Create channel (idempotent - returns existing if already exists)
            $channel->create($createdBy->id);
            
            // Ensure all members are added to the channel (important for mentors accessing existing channels)
            try {
                $channel->addMembers($memberIds);
            } catch (\Exception $e) {
                // Ignore errors if members are already in the channel
                // This is expected for existing channels
                Log::debug('Stream Chat add members - some members may already be in channel', [
                    'channel_id' => $channelId,
                    'error' => $e->getMessage(),
                ]);
            }
            
            return $channel;
        } catch (\Exception $e) {
            Log::error('Stream Chat team channel creation failed', [
                'channel_id' => $channelId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Create or get a hackathon channel (group chat for hackathon)
     *
     * @param int $hackathonId
     * @param array $memberIds
     * @param User $createdBy
     * @return Channel
     */
    public function getOrCreateHackathonChannel(int $hackathonId, array $memberIds, User $createdBy): Channel
    {
        $client = $this->ensureClient();
        $channelId = 'hackathon-' . $hackathonId;
        
        try {
            $channel = $client->channel('messaging', $channelId, [
                'members' => $memberIds,
                'created_by_id' => $createdBy->id,
                'name' => 'Hackathon Chat',
            ]);
            
            $channel->create($createdBy->id);
            
            return $channel;
        } catch (\Exception $e) {
            Log::error('Stream Chat hackathon channel creation failed', [
                'channel_id' => $channelId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update user in Stream Chat
     *
     * @param User $user
     * @return void
     */
    public function updateUser(User $user): void
    {
        try {
            $client = $this->ensureClient();
            $client->updateUser([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar ? AvatarHelper::generateAvatarUrl($user->avatar) : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Stream Chat user update failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - allow chat to work without Stream Chat if not configured
        }
    }

    /**
     * Delete user from Stream Chat
     *
     * @param string $userId
     * @return void
     */
    public function deleteUser(string $userId): void
    {
        try {
            $client = $this->ensureClient();
            $client->deleteUser($userId, [
                'mark_messages_deleted' => false,
                'hard_delete' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Stream Chat user deletion failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get channel by ID
     *
     * @param string $channelType
     * @param string $channelId
     * @return Channel
     */
    public function getChannel(string $channelType, string $channelId): Channel
    {
        $client = $this->ensureClient();
        return $client->channel($channelType, $channelId);
    }
}

