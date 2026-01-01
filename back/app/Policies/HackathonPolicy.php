<?php

namespace App\Policies;

use App\Models\Hackathon;
use App\Models\User;

class HackathonPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Anyone can view hackathons (they're public)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Hackathon $hackathon): bool
    {
        // Anyone can view hackathons
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['organizer', 'super_admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Hackathon $hackathon): bool
    {
        return $user->hasRole('super_admin') || $hackathon->created_by === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Hackathon $hackathon): bool
    {
        // Can delete only if no teams
        $hasNoTeams = !$hackathon->teams()->exists();
        
        return $hasNoTeams && 
               ($user->hasRole('super_admin') || $hackathon->created_by === $user->id);
    }

    /**
     * Determine whether the user can manage the hackathon (assign judges, etc.)
     */
    public function manage(User $user, Hackathon $hackathon): bool
    {
        return $this->update($user, $hackathon);
    }
}