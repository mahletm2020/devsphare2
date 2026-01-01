<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hackathon_id' => $this->hackathon_id,
            'team' => $this->whenLoaded('team', function () {
                return [
                    'id' => $this->team->id,
                    'name' => $this->team->name,
                    'category' => $this->team->category ? [
                        'id' => $this->team->category->id,
                        'name' => $this->team->category->name,
                    ] : null,
                ];
            }),
            'title' => $this->title,
            'description' => $this->description,
            'github_url' => $this->github_url,
            'video_url' => $this->video_url,
            'live_url' => $this->live_url,
            'file_path' => $this->file_path,
            'file_url' => $this->file_url,
            'average_score' => $this->average_score,
            'rating_count' => $this->rating_count,
            'is_winner' => $this->is_winner,
            'winner_position' => $this->winner_position,
            'ratings' => RatingResource::collection($this->whenLoaded('ratings')),
            'submitted_at' => $this->submitted_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}