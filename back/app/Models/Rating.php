<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'judge_id',
        'innovation',
        'execution',
        'ux_ui',
        'feasibility',
        'total_score',
        'comments',
    ];

    protected $casts = [
        'innovation' => 'integer',
        'execution' => 'integer',
        'ux_ui' => 'integer',
        'feasibility' => 'integer',
        'total_score' => 'integer',
    ];

    // Relationships
    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function judge()
    {
        return $this->belongsTo(User::class, 'judge_id');
    }

    // Scopes
    public function scopeByJudge($query, $judgeId)
    {
        return $query->where('judge_id', $judgeId);
    }

    public function scopeForHackathon($query, $hackathonId)
    {
        return $query->whereHas('submission', function ($q) use ($hackathonId) {
            $q->where('hackathon_id', $hackathonId);
        });
    }
}




















