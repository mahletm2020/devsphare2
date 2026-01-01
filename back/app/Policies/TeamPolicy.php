<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only participants can create teams
        return $user->hasRole('participant');
    }

    /**
     * Determine whether the user can join the team.
     */
    public function join(User $user, Team $team): bool
    {
        // Check if user is already in a team for this hackathon
        $alreadyInTeam = $team->hackathon->teams()
            ->whereHas('members', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })->exists();

        // Check if user is judge/mentor for this hackathon
        $isJudge = $team->hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $team->hackathon->mentors()->where('users.id', $user->id)->exists();

        return !$alreadyInTeam && !$isJudge && !$isMentor && $user->hasRole('participant');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Team $team): bool
    {
        // Team members, organizers, judges, mentors can view
        $isMember = $team->members()->where('users.id', $user->id)->exists();
        $isOrganizer = $team->hackathon->created_by === $user->id;
        $isSuperAdmin = $user->hasRole('super_admin');
        $isJudge = $team->hackathon->judges()->where('users.id', $user->id)->exists();
        $isMentor = $team->hackathon->mentors()->where('users.id', $user->id)->exists();

        return $isMember || $isOrganizer || $isSuperAdmin || $isJudge || $isMentor;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Team $team): bool
    {
        // Only team leader can update
        return $team->leader_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Team $team): bool
    {
        // Only team leader can delete, and only if no submission
        $hasNoSubmission = !$team->submission()->exists();
        
        return $hasNoSubmission && $team->leader_id === $user->id;
    }

    /**
     * Determine whether the user can lock/unlock the team.
     */
    public function manage(User $user, Team $team): bool
    {
        return $user->hasRole('super_admin') || $team->hackathon->created_by === $user->id;
    }
}