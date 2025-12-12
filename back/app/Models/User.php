<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name','email','password','bio','avatar',
    ];

    protected $hidden = [
        'password','remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // teams the user is member of
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_user')->withTimestamps();
    }

    // teams where user is mentor
    public function mentorTeams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_mentor')->withTimestamps();
    }

    // teams where user is judge
    public function judgeTeams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_judge')->withTimestamps();
    }
}
