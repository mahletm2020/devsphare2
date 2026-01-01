<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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
        'live_url',
        'file_path',
        'readme_file_path',
        'ppt_file_path',
        'average_score',
        'rating_count',
        'submitted_at',
        'is_winner',
        'winner_position',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'average_score' => 'decimal:2',
        'rating_count' => 'integer',
        'is_winner' => 'boolean',
        'winner_position' => 'integer',
    ];

    // Relationships
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

    // Scopes
    public function scopeWinners($query)
    {
        return $query->where('is_winner', true)
                     ->orderBy('winner_position');
    }

    public function scopeByHackathon($query, $hackathonId)
    {
        return $query->where('hackathon_id', $hackathonId);
    }

    public function scopeWithAverage($query)
    {
        return $query->withAvg('ratings as average_rating', 'total_score');
    }

    // Attributes
    public function getFileUrlAttribute()
    {
        if (!$this->file_path) return null;
        return Storage::disk(config('filesystems.default'))->url($this->file_path);
    }

    public function getHasFileAttribute()
    {
        return !empty($this->file_path);
    }
}
















