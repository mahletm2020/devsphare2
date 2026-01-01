<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\AvatarHelper;

class HackathonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isSponsor = $user && ($user->hasRole('sponsor') || $user->hasRole('super_admin'));
        $isOrganizer = $user && ($this->created_by === $user->id || $user->hasRole('super_admin'));
        $canSeeSponsorDetails = $isSponsor || $isOrganizer;

        return [
            'id' => $this->id,
            'organization' => $this->whenLoaded('organization', function () {
                // Return organization data or null
                if (!$this->organization) {
                    return null;
                }
                return [
                    'id' => $this->organization->id,
                    'name' => $this->organization->name,
                    'slug' => $this->organization->slug,
                    'logo' => $this->organization->logo,
                    'logo_url' => AvatarHelper::generateAvatarUrl($this->organization->logo),
                ];
            }),
            'organizer' => $this->whenLoaded('creator', function () {
                if (!$this->creator) {
                    return null;
                }
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                    'avatar' => $this->creator->avatar,
                    'avatar_url' => AvatarHelper::generateAvatarUrl($this->creator->avatar),
                ];
            }),
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'type' => $this->type,
            'need_sponsor' => $this->need_sponsor,
            'has_sponsors' => $this->has_sponsors,
            'sponsor_logos' => $this->sponsor_logos,
            'sponsor_visibility' => $this->sponsor_visibility,
            'sponsor_listing_expiry' => $this->sponsor_listing_expiry,
            // Sponsorship details - only visible to sponsors and organizers
            'sponsorship_type_preferred' => $this->when($canSeeSponsorDetails, $this->sponsorship_type_preferred),
            'sponsorship_amount_preferred' => $this->when($canSeeSponsorDetails, $this->sponsorship_amount_preferred),
            'sponsorship_details' => $this->when($canSeeSponsorDetails, $this->sponsorship_details),
            'sponsor_benefits_offered' => $this->when($canSeeSponsorDetails, $this->sponsor_benefits_offered),
            'sponsor_requirements' => $this->when($canSeeSponsorDetails, $this->sponsor_requirements),
            'sponsor_contact_email' => $this->when($canSeeSponsorDetails, $this->sponsor_contact_email),
            'sponsor_contact_phone' => $this->when($canSeeSponsorDetails, $this->sponsor_contact_phone),
            'team_deadline' => $this->team_deadline,
            'team_joining_start' => $this->team_joining_start,
            'team_joining_end' => $this->team_joining_end,
            'mentor_assignment_start' => $this->mentor_assignment_start,
            'mentor_assignment_end' => $this->mentor_assignment_end,
            'submission_deadline' => $this->submission_deadline,
            'submission_start' => $this->submission_start,
            'submission_end' => $this->submission_end,
            'submission_judging_gap_hours' => $this->submission_judging_gap_hours,
            'judging_deadline' => $this->judging_deadline,
            'judging_start' => $this->judging_start,
            'judging_end' => $this->judging_end,
            'winner_announcement_time' => $this->winner_announcement_time,
            'status' => $this->status,
            'lifecycle_status' => $this->lifecycle_status,
            'max_team_size' => $this->max_team_size,
            'is_accepting_teams' => $this->is_accepting_teams,
            'is_accepting_submissions' => $this->is_accepting_submissions,
            'is_judging' => $this->is_judging,
            'is_sponsor_listing_active' => $this->is_sponsor_listing_active,
            'has_organization' => $this->has_organization, // New field
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'teams_count' => $this->when(isset($this->teams_count), $this->teams_count),
            'submissions_count' => $this->when(isset($this->submissions_count), $this->submissions_count),
            'judges_count' => $this->when(isset($this->judges_count), $this->judges_count),
            'mentors_count' => $this->when(isset($this->mentors_count), $this->mentors_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}










