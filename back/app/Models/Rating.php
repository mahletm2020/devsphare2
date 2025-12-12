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
    ];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function judge()
    {
        return $this->belongsTo(User::class, 'judge_id');
    }
}




