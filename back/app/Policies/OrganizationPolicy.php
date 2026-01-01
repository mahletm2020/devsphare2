<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['organizer', 'super_admin']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Organization $organization): bool
    {
        return $user->hasRole('super_admin') || $organization->owner_id === $user->id;
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
    public function update(User $user, Organization $organization): bool
    {
        return $user->hasRole('super_admin') || $organization->owner_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Organization $organization): bool
    {
        // Can delete only if no hackathons
        $hasNoHackathons = !$organization->hackathons()->exists();
        
        return $hasNoHackathons && 
               ($user->hasRole('super_admin') || $organization->owner_id === $user->id);
    }

    /**
     * Determine whether the user can view hackathons for the organization.
     */
    public function viewHackathons(User $user, Organization $organization): bool
    {
        return $this->view($user, $organization);
    }
}




















