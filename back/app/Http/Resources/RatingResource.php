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
            'judge_id' => $this->judge_id,
            'innovation' => $this->innovation,
            'execution' => $this->execution,
            'ux_ui' => $this->ux_ui,
            'feasibility' => $this->feasibility,
            'total_score' => $this->total_score,
        ];
    }
}


