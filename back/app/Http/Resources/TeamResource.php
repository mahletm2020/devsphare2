<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\AvatarHelper;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hackathon_id' => $this->hackathon_id,
            'hackathon' => $this->whenLoaded('hackathon', function () {
                return [
                    'id' => $this->hackathon->id,
                    'title' => $this->hackathon->title,
                    'status' => $this->hackathon->status,
                    'team_deadline' => $this->hackathon->team_deadline,
                    'submission_deadline' => $this->hackathon->submission_deadline,
                ];
            }),
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),
            'leader_id' => $this->leader_id,
            'leader' => $this->whenLoaded('leader', function () {
                return [
                    'id' => $this->leader->id,
                    'name' => $this->leader->name,
                    'avatar' => $this->leader->avatar,
                    'avatar_url' => AvatarHelper::generateAvatarUrl($this->leader->avatar),
                ];
            }),
            'name' => $this->name,
            'description' => $this->description,
            'is_locked' => $this->is_locked,
            'is_solo' => $this->is_solo,
            'member_count' => $this->when(isset($this->members_count), $this->members_count),
            'is_full' => $this->is_full,
            'has_submission' => $this->has_submission,
            'members' => $this->whenLoaded('members', function () {
                return $this->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'avatar' => $member->avatar,
                        'avatar_url' => AvatarHelper::generateAvatarUrl($member->avatar),
                    ];
                });
            }),
            'judges' => $this->whenLoaded('judges', function () {
                return $this->judges->map(function ($judge) {
                    return [
                        'id' => $judge->id,
                        'name' => $judge->name,
                    ];
                });
            }),
            'mentors' => $this->whenLoaded('mentors', function () {
                return $this->mentors->map(function ($mentor) {
                    return [
                        'id' => $mentor->id,
                        'name' => $mentor->name,
                        'avatar' => $mentor->avatar,
                        'avatar_url' => AvatarHelper::generateAvatarUrl($mentor->avatar),
                        'status' => $mentor->pivot->status ?? null, // 'pending' or 'accepted'
                    ];
                });
            }),
            'is_user_mentor' => $this->when($request->user(), function () use ($request) {
                $user = $request->user();
                if (!$user) return false;
                return $this->mentors()->where('users.id', $user->id)
                    ->wherePivot('status', 'accepted')
                    ->exists();
            }),
            'submission' => $this->whenLoaded('submission', function () {
                return [
                    'id' => $this->submission->id,
                    'title' => $this->submission->title,
                    'average_score' => $this->submission->average_score,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}