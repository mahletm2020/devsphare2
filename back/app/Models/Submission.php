<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'hackathon_id',
        'team_id',
        'title',
        'description',
        'github_url',
        'video_url',
        'file_path',
    ];

    public function hackathon()
    {
        return $this->belongsTo(Hackathon::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
}




