<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'submission_id' => $this->submission_id,
            'judge' => $this->whenLoaded('judge', function () {
                return [
                    'id' => $this->judge->id,
                    'name' => $this->judge->name,
                ];
            }),
            'innovation' => $this->innovation,
            'execution' => $this->execution,
            'ux_ui' => $this->ux_ui,
            'feasibility' => $this->feasibility,
            'total_score' => $this->total_score,
            'comments' => $this->comments,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}