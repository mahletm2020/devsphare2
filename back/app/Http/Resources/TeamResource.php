<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hackathon_id' => $this->hackathon_id,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                ];
            }),
            'leader_id' => $this->leader_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_locked' => $this->is_locked,
            'members' => $this->whenLoaded('members', function () {
                return $this->members->map(function ($m) {
                    return [
                        'id' => $m->id,
                        'name' => $m->name,
                    ];
                });
            }),
        ];
    }
}


