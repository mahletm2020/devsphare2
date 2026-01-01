<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'description',
        'website',
        'logo',
    ];

    // Relationships
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function hackathons()
    {
        return $this->hasMany(Hackathon::class);
    }

    // Scopes
    public function scopeSearch($query, $searchTerm)
    {
        return $query->where('name', 'ilike', "%{$searchTerm}%");
    }

    // Attributes
    public function getActiveHackathonsCountAttribute()
    {
        return $this->hackathons()
            ->where('status', 'published')
            ->where('team_deadline', '>', now())
            ->count();
    }

    public function getCompletedHackathonsCountAttribute()
    {
        return $this->hackathons()
            ->where('status', 'results_published')
            ->count();
    }
}




















