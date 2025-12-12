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
                ];
            }),
            'title' => $this->title,
            'description' => $this->description,
            'github_url' => $this->github_url,
            'video_url' => $this->video_url,
            'file_path' => $this->file_path,
            'ratings' => RatingResource::collection($this->whenLoaded('ratings')),
        ];
    }
}


