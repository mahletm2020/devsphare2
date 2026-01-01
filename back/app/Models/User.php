<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'bio',
        'is_searchable',
        'is_willing_judge',
        'is_willing_mentor',
        'email_verification_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_searchable' => 'boolean',
        'is_willing_judge' => 'boolean',
        'is_willing_mentor' => 'boolean',
    ];

    // Relationships
    public function ownedOrganizations()
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_user');
    }

    public function leadingTeams()
    {
        return $this->hasMany(Team::class, 'leader_id');
    }

    public function judgeHackathons()
    {
        return $this->belongsToMany(Hackathon::class, 'hackathon_judges')
                    ->withPivot('status')
                    ->withTimestamps();
    }

    public function mentorHackathons()
    {
        return $this->belongsToMany(Hackathon::class, 'hackathon_mentors');
    }

    public function sponsoredHackathons()
    {
        return $this->belongsToMany(Hackathon::class, 'hackathon_sponsors');
    }

    public function createdHackathons()
    {
        return $this->hasMany(Hackathon::class, 'created_by');
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'user_skills');
    }
    
    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
    public function judgedTeams()
    {
        return $this->belongsToMany(Team::class, 'team_judge', 'user_id', 'team_id');
    }

    public function mentoredTeams()
    {
        return $this->belongsToMany(Team::class, 'team_mentor', 'user_id', 'team_id');
    }

    public function judgeRatings()
    {
        return $this->hasMany(Rating::class, 'judge_id');
    }

    public function adRequests()
    {
        return $this->hasMany(AdRequest::class, 'sponsor_id');
    }

    // Scopes
    public function scopeWillingJudges($query)
    {
        return $query->where('is_willing_judge', true);
    }

    public function scopeWillingMentors($query)
    {
        return $query->where('is_willing_mentor', true);
    }

    public function scopeSearchable($query)
    {
        return $query->where('is_searchable', true);
    }
}