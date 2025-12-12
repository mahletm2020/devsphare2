<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HackathonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'organization' => $this->whenLoaded('organization', function () {
                return [
                    'id' => $this->organization->id,
                    'name' => $this->organization->name,
                ];
            }),
            'organizer_id' => $this->organizer_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'type' => $this->type,
            'need_sponsor' => $this->need_sponsor,
            'sponsor_visibility' => $this->sponsor_visibility,
            'sponsor_listing_expiry' => $this->sponsor_listing_expiry,
            'team_deadline' => $this->team_deadline,
            'submission_deadline' => $this->submission_deadline,
            'judging_deadline' => $this->judging_deadline,
            'status' => $this->status,
            'max_team_size' => $this->max_team_size,
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
        ];
    }
}




