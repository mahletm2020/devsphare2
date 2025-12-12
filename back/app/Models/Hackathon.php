<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hackathon extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'slug',
        'description',
        'type',
        'need_sponsor',
        'sponsor_visibility',
        'sponsor_listing_expiry',
        'team_deadline',
        'submission_deadline',
        'judging_deadline',
        'status',
        'max_team_size',
    ];

    protected $casts = [
        'need_sponsor' => 'boolean',
        'sponsor_listing_expiry' => 'datetime',
        'team_deadline' => 'datetime',
        'submission_deadline' => 'datetime',
        'judging_deadline' => 'datetime',
    ];

    public function organizer()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function teams()
    {
        return $this->hasMany(Team::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
