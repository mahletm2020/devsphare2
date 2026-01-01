<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use App\Helpers\AvatarHelper;

class OrganizationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'website' => $this->website,
            'logo' => $this->logo,
            'logo_url' => $this->logo ? AvatarHelper::generateAvatarUrl($this->logo) : null,
            'owner' => $this->whenLoaded('owner', function () {
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ];
            }),
            'hackathons' => $this->whenLoaded('hackathons', function () {
                return $this->hackathons->map(function ($hackathon) {
                    return [
                        'id' => $hackathon->id,
                        'title' => $hackathon->title,
                        'slug' => $hackathon->slug,
                        'status' => $hackathon->status,
                        'created_at' => $hackathon->created_at,
                    ];
                });
            }),
            'active_hackathons_count' => $this->when(isset($this->active_hackathons_count), $this->active_hackathons_count),
            'completed_hackathons_count' => $this->when(isset($this->completed_hackathons_count), $this->completed_hackathons_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}










