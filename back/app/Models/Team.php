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
    ];

    protected $casts = [
        'is_locked' => 'boolean',
    ];

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
        return $this->belongsToMany(User::class, 'team_user')->withTimestamps();
    }

    public function mentors()
    {
        return $this->belongsToMany(User::class, 'team_mentor')->withTimestamps();
    }

    public function judges()
    {
        return $this->belongsToMany(User::class, 'team_judge')->withTimestamps();
    }

    public function submission()
    {
        return $this->hasOne(Submission::class);
    }
}
