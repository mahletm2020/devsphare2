<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Hackathon extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'created_by',
        'title',
        'slug',
        'description',
        'type',
        'location',
        'need_sponsor',
        'has_sponsors',
        'sponsor_logos',
        'sponsor_visibility',
        'sponsor_listing_expiry',
        'sponsorship_type_preferred',
        'sponsorship_amount_preferred',
        'sponsorship_details',
        'sponsor_benefits_offered',
        'sponsor_requirements',
        'sponsor_contact_email',
        'sponsor_contact_phone',
        'team_deadline',
        'team_joining_start',
        'team_joining_end',
        'mentor_assignment_start',
        'mentor_assignment_end',
        'submission_deadline',
        'submission_start',
        'submission_end',
        'submission_judging_gap_hours',
        'judging_deadline',
        'judging_start',
        'judging_end',
        'winner_announcement_time',
        'status',
        'lifecycle_status',
        'max_team_size',
    ];

    protected $casts = [
        'team_deadline' => 'datetime',
        'team_joining_start' => 'datetime',
        'team_joining_end' => 'datetime',
        'mentor_assignment_start' => 'datetime',
        'mentor_assignment_end' => 'datetime',
        'submission_deadline' => 'datetime',
        'submission_start' => 'datetime',
        'submission_end' => 'datetime',
        'judging_deadline' => 'datetime',
        'judging_start' => 'datetime',
        'judging_end' => 'datetime',
        'winner_announcement_time' => 'datetime',
        'sponsor_listing_expiry' => 'datetime',
        'need_sponsor' => 'boolean',
        'has_sponsors' => 'boolean',
        'sponsor_logos' => 'array',
        'submission_judging_gap_hours' => 'integer',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
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
        return $this->hasManyThrough(Submission::class, Team::class);
    }

    public function judges()
    {
        return $this->belongsToMany(User::class, 'hackathon_judges')
                    ->withTimestamps();
    }

    public function mentors()
    {
        return $this->belongsToMany(User::class, 'hackathon_mentors')
                    ->withTimestamps();
    }

    public function sponsors()
    {
        return $this->belongsToMany(User::class, 'hackathon_sponsors')
                    ->withTimestamps();
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'published')
                     ->where('team_deadline', '>', now());
    }

    public function scopeJudgingPhase($query)
    {
        return $query->where('status', 'judging')
                     ->where('judging_deadline', '>', now());
    }

    // Scopes for organization (null or not null)
    public function scopeWithOrganization($query)
    {
        return $query->whereNotNull('organization_id');
    }

    public function scopeWithoutOrganization($query)
    {
        return $query->whereNull('organization_id');
    }

    // Attributes
    public function getIsAcceptingTeamsAttribute()
    {
        return $this->status === 'published' && 
               Carbon::now()->lessThan($this->team_deadline);
    }

    public function getIsAcceptingSubmissionsAttribute()
    {
        return $this->status === 'published' && 
               Carbon::now()->lessThan($this->submission_deadline);
    }

    public function getIsJudgingAttribute()
    {
        return $this->status === 'judging' && 
               Carbon::now()->lessThan($this->judging_deadline);
    }

    public function getIsSponsorListingActiveAttribute()
    {
        return $this->need_sponsor && 
               (!$this->sponsor_listing_expiry || 
                Carbon::now()->lessThan($this->sponsor_listing_expiry));
    }

    // Check if hackathon has organization
    public function getHasOrganizationAttribute()
    {
        return !is_null($this->organization_id);
    }

    /**
     * Calculate and update lifecycle status based on current time
     */
    public function calculateLifecycleStatus(): string
    {
        $now = Carbon::now();

        // Ended - after winner announcement or judging end
        if ($this->winner_announcement_time && $now->greaterThan($this->winner_announcement_time)) {
            return 'ended';
        }
        if ($this->judging_end && $now->greaterThan($this->judging_end)) {
            return 'ended';
        }

        // Judging phase
        if ($this->judging_start && $this->judging_end) {
            if ($now->greaterThanOrEqualTo($this->judging_start) && $now->lessThanOrEqualTo($this->judging_end)) {
                return 'judging';
            }
        }

        // Submission-Judging gap
        if ($this->submission_end && $this->judging_start) {
            $gapEnd = $this->judging_start->copy()->subHours($this->submission_judging_gap_hours ?? 24);
            if ($now->greaterThan($this->submission_end) && $now->lessThan($this->judging_start)) {
                return 'submission_judging_gap';
            }
        }

        // Submission phase
        if ($this->submission_start && $this->submission_end) {
            if ($now->greaterThanOrEqualTo($this->submission_start) && $now->lessThanOrEqualTo($this->submission_end)) {
                return 'submission';
            }
        }

        // Mentor assignment phase
        if ($this->mentor_assignment_start && $this->mentor_assignment_end) {
            if ($now->greaterThanOrEqualTo($this->mentor_assignment_start) && $now->lessThanOrEqualTo($this->mentor_assignment_end)) {
                return 'mentor_assignment';
            }
        }

        // Team joining phase
        if ($this->team_joining_start && $this->team_joining_end) {
            if ($now->greaterThanOrEqualTo($this->team_joining_start) && $now->lessThanOrEqualTo($this->team_joining_end)) {
                return 'team_joining';
            }
        }

        // Upcoming - before team joining starts
        return 'upcoming';
    }

    /**
     * Update lifecycle status
     */
    public function updateLifecycleStatus(): void
    {
        $newStatus = $this->calculateLifecycleStatus();
        if ($this->lifecycle_status !== $newStatus) {
            $this->lifecycle_status = $newStatus;
            $this->saveQuietly(); // Save without triggering events
        }
    }

    // Time-based access checks
    public function isTeamJoiningOpen(): bool
    {
        if (!$this->team_joining_start || !$this->team_joining_end) {
            return false;
        }
        $now = Carbon::now();
        return $now->greaterThanOrEqualTo($this->team_joining_start) && 
               $now->lessThanOrEqualTo($this->team_joining_end);
    }

    public function isMentorAssignmentOpen(): bool
    {
        if (!$this->mentor_assignment_start || !$this->mentor_assignment_end) {
            return false;
        }
        $now = Carbon::now();
        return $now->greaterThanOrEqualTo($this->mentor_assignment_start) && 
               $now->lessThanOrEqualTo($this->mentor_assignment_end);
    }

    public function isSubmissionOpen(): bool
    {
        if (!$this->submission_start || !$this->submission_end) {
            return false;
        }
        $now = Carbon::now();
        return $now->greaterThanOrEqualTo($this->submission_start) && 
               $now->lessThanOrEqualTo($this->submission_end);
    }

    public function isInSubmissionJudgingGap(): bool
    {
        if (!$this->submission_end || !$this->judging_start) {
            return false;
        }
        $now = Carbon::now();
        return $now->greaterThan($this->submission_end) && 
               $now->lessThan($this->judging_start);
    }

    public function isJudgingOpen(): bool
    {
        if (!$this->judging_start || !$this->judging_end) {
            return false;
        }
        $now = Carbon::now();
        return $now->greaterThanOrEqualTo($this->judging_start) && 
               $now->lessThanOrEqualTo($this->judging_end);
    }

    public function isEnded(): bool
    {
        if ($this->winner_announcement_time) {
            return Carbon::now()->greaterThan($this->winner_announcement_time);
        }
        if ($this->judging_end) {
            return Carbon::now()->greaterThan($this->judging_end);
        }
        return false;
    }

    public function canMentorAccess(): bool
    {
        return $this->isMentorAssignmentOpen() || 
               ($this->judging_start && Carbon::now()->lessThan($this->judging_start));
    }

    public function canJudgeAccess(): bool
    {
        return $this->isJudgingOpen();
    }
}
















