<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'hackathon_id',
        'category_id',
        'leader_id',
        'name',
        'description',
        'is_locked',
        'is_solo',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'is_solo' => 'boolean',
    ];

    // Relationships
    public function hackathon()
    {
        return $this->belongsTo(Hackathon::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'team_user')
                    ->withTimestamps();
    }

    public function judges()
    {
        return $this->belongsToMany(User::class, 'team_judge')
                    ->withTimestamps();
    }

    public function mentors()
    {
        return $this->belongsToMany(User::class, 'team_mentor')
                    ->withPivot('status')
                    ->withTimestamps();
    }

    public function submission()
    {
        return $this->hasOne(Submission::class);
    }

    // Scopes
    public function scopeByHackathon($query, $hackathonId)
    {
        return $query->where('hackathon_id', $hackathonId);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_locked', false);
    }

    // Attributes
    public function getMemberCountAttribute()
    {
        return $this->members()->count();
    }

    public function getHasSubmissionAttribute()
    {
        return $this->submission()->exists();
    }

    public function getIsFullAttribute()
    {
        // Solo teams are always "full" (cannot add members)
        if ($this->is_solo) {
            return true;
        }
        return $this->members()->count() >= $this->hackathon->max_team_size;
    }
}



















