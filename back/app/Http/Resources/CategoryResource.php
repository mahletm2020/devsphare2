<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hackathon_id' => $this->hackathon_id,
            'name' => $this->name,
            'description' => $this->description,
            'max_teams' => $this->max_teams,
            'team_count' => $this->when(isset($this->teams_count), $this->teams_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}




















