<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HackathonResource;
use App\Models\Hackathon;
use App\Models\Organization;
use App\Models\Submission;
use App\Models\BlogPost;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Events\HackathonPublished;
use App\Events\ResultsPublished;
use App\Events\CertificateAvailable;

class HackathonController extends Controller
{
    // List hackathons with filters
 // In HackathonController.php - UPDATE the index method:

public function index(Request $request)
{
    $user = $request->user();
    
    $validated = $request->validate([
        'search' => ['nullable', 'string', 'max:100'],
        'type' => ['nullable', 'in:online,in_person,hybrid'],
        'category' => ['nullable', 'string'],
        'status' => ['nullable', 'in:draft,published,registration_closed,submission_closed,judging,results_published'],
        'organization_id' => ['nullable', 'exists:organizations,id'],
        'need_sponsor' => ['nullable', 'boolean'],
        'created_by' => ['nullable', 'exists:users,id'],
        'featured' => ['nullable', 'in:sponsored,new,most_participated,multiple_organizers'],
    ]);

    $query = Hackathon::with(['organization:id,name', 'categories:id,hackathon_id,name'])
        ->when(!$user || !$user->hasRole('super_admin'), function ($q) use ($user) {
            // Hide drafts from non-creators
            $q->where(function ($subQuery) use ($user) {
                $subQuery->where('status', '!=', 'draft');
                // Show drafts only to their creator
                if ($user) {
                    $subQuery->orWhere(function ($draftQuery) use ($user) {
                        $draftQuery->where('status', 'draft')
                                   ->where('created_by', $user->id);
                    });
                }
            });
        })
        // Show all published hackathons on home page - don't filter by sponsor needs
        // The sponsor filtering only applies to the sponsor dashboard endpoint
        ->when(isset($validated['search']), function ($q) use ($validated) {
            $q->where(function ($query) use ($validated) {
                $query->where('title', 'like', "%{$validated['search']}%")
                      ->orWhere('description', 'like', "%{$validated['search']}%")
                      ->orWhereHas('organization', function ($orgQuery) use ($validated) {
                          $orgQuery->where('name', 'like', "%{$validated['search']}%");
                      })
                      ->orWhereHas('categories', function ($catQuery) use ($validated) {
                          $catQuery->where('name', 'like', "%{$validated['search']}%");
                      });
            });
        })
        ->when(isset($validated['type']), fn($q) => $q->where('type', $validated['type']))
        ->when(isset($validated['status']), fn($q) => $q->where('status', $validated['status']))
        ->when(isset($validated['organization_id']), fn($q) => $q->where('organization_id', $validated['organization_id']))
        ->when(isset($validated['created_by']), fn($q) => $q->where('created_by', $validated['created_by']))
        ->when(isset($validated['need_sponsor']), function ($q) use ($validated) {
            $q->where('need_sponsor', $validated['need_sponsor'])
              ->where(function ($query) {
                  $query->whereNull('sponsor_listing_expiry')
                        ->orWhere('sponsor_listing_expiry', '>', now());
              });
        })
        ->when(isset($validated['category']), function ($q) use ($validated) {
            $q->whereHas('categories', function ($cq) use ($validated) {
                $cq->where('name', 'like', "%{$validated['category']}%");
            });
        })
        ->when(isset($validated['featured']), function ($q) use ($validated) {
            if ($validated['featured'] === 'sponsored') {
                $q->where('need_sponsor', true)
                  ->where('status', 'published')
                  ->where(function ($query) {
                      $query->whereNull('sponsor_listing_expiry')
                            ->orWhere('sponsor_listing_expiry', '>', now());
                  });
            } elseif ($validated['featured'] === 'new') {
                $q->where('status', 'published')
                  ->where('created_at', '>', now()->subDays(30)); // Changed from 7 to 30 days
            } elseif ($validated['featured'] === 'most_participated') {
                $q->withCount('teams')
                  ->where('status', 'published')
                  ->orderBy('teams_count', 'desc');
            }
        })
        ->when(!isset($validated['featured']) || $validated['featured'] !== 'most_participated', function ($q) {
            $q->orderByDesc('created_at');
        });

    return HackathonResource::collection($query->paginate(20));
}

    // Create hackathon
    public function store(Request $request)
    {
        $user = $request->user();

        // Authorization
        if (!$user->hasAnyRole(['organizer', 'super_admin'])) { 
            abort(403, 'Only organizers can create hackathons.');
        }

        // Validate - organization_id is now optional
        $data = $request->validate([
            'organization_id' => ['nullable', 'exists:organizations,id'], // CHANGED: required → nullable
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'type' => ['required', 'in:online,in_person,hybrid'],
            'location' => ['nullable', 'string', 'max:500'],
            'need_sponsor' => ['nullable', 'boolean'],
            'has_sponsors' => ['nullable', 'boolean'],
            'sponsor_logos' => ['nullable', 'array'], // For file uploads
            'sponsor_logos.*' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'], // 5MB max per logo
            'sponsor_visibility' => [
                'nullable',
                'in:public,sponsors_only'
            ],
            'sponsor_listing_expiry' => [
                'nullable',
                'date',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor') && 
                           $request->sponsor_visibility === 'public';
                })
            ],
            'sponsorship_type_preferred' => [
                'nullable',
                'string',
                'in:financial,in_kind,both'
            ],
            'sponsorship_amount_preferred' => ['nullable', 'numeric', 'min:0'],
            'sponsorship_details' => ['nullable', 'string'],
            'sponsor_benefits_offered' => ['nullable', 'string'],
            'sponsor_requirements' => ['nullable', 'string'],
            'sponsor_contact_email' => ['nullable', 'email'],
            'sponsor_contact_phone' => ['nullable', 'string', 'max:20'],
            // Timeline fields
            'team_joining_start' => ['required', 'date'],
            'team_joining_end' => ['required', 'date', 'after_or_equal:team_joining_start'],
            'submission_start' => ['required', 'date', 'after_or_equal:team_joining_start'],
            'submission_end' => ['required', 'date', 'after_or_equal:submission_start'],
            'mentor_assignment_start' => ['required', 'date', 'after_or_equal:team_joining_end'],
            'mentor_assignment_end' => ['required', 'date', 'after_or_equal:mentor_assignment_start'],
            'judging_start' => ['required', 'date', 'after_or_equal:mentor_assignment_end', 'after_or_equal:submission_start'],
            'judging_end' => ['required', 'date', 'after:judging_start'],
            // Legacy deadline fields (for backward compatibility)
            'team_deadline' => ['sometimes', 'date'],
            'submission_deadline' => ['sometimes', 'date'],
            'judging_deadline' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:draft,published'],
            'max_team_size' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        // Check organization ownership ONLY if organization_id is provided
        if (isset($data['organization_id'])) {
            $organization = Organization::findOrFail($data['organization_id']);
            
            if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
                abort(403, 'You do not own this organization.');
            }
        }
        // If no organization_id provided, it stays null (NO auto-creation)

        // Generate unique slug
        $baseSlug = Str::slug($data['title']);
        $slug = $baseSlug;
        $counter = 1;
        
        while (Hackathon::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        // Handle sponsor logo uploads - allow logos when has_sponsors OR when logos are provided (optional)
        $sponsorLogos = [];
        if ($request->hasFile('sponsor_logos')) {
            $sponsorLogosDir = 'sponsor-logos';
            // Ensure directory exists
            if (!Storage::disk('public')->exists($sponsorLogosDir)) {
                Storage::disk('public')->makeDirectory($sponsorLogosDir);
            }

            foreach ($request->file('sponsor_logos') as $index => $logoFile) {
                if ($logoFile && $logoFile->isValid()) {
                    $fileName = 'sponsor_' . $user->id . '_' . time() . '_' . $index . '.' . $logoFile->getClientOriginalExtension();
                    $path = $logoFile->storeAs($sponsorLogosDir, $fileName, 'public');
                    if ($path) {
                        $sponsorLogos[] = Storage::disk('public')->url($path);
                    }
                }
            }
        }
        
        // If logos are uploaded, set has_sponsors to true
        if (!empty($sponsorLogos)) {
            $data['has_sponsors'] = true;
        }

        // Create hackathon - organization_id can be null
        $hackathon = Hackathon::create([
            'organization_id' => $data['organization_id'] ?? null, // CHANGED: Can be null
            'created_by' => $user->id,
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'],
            'type' => $data['type'],
            'location' => $data['location'] ?? null,
            'need_sponsor' => $data['need_sponsor'] ?? false,
            'has_sponsors' => $data['has_sponsors'] ?? false,
            'sponsor_logos' => !empty($sponsorLogos) ? $sponsorLogos : null,
            'sponsor_visibility' => $data['need_sponsor'] ? $data['sponsor_visibility'] : null,
            'sponsor_listing_expiry' => $data['need_sponsor'] ? $data['sponsor_listing_expiry'] : null,
            'sponsorship_type_preferred' => $data['need_sponsor'] ? ($data['sponsorship_type_preferred'] ?? null) : null,
            'sponsorship_amount_preferred' => $data['need_sponsor'] ? ($data['sponsorship_amount_preferred'] ?? null) : null,
            'sponsorship_details' => $data['need_sponsor'] ? ($data['sponsorship_details'] ?? null) : null,
            'sponsor_benefits_offered' => $data['need_sponsor'] ? ($data['sponsor_benefits_offered'] ?? null) : null,
            'sponsor_requirements' => $data['need_sponsor'] ? ($data['sponsor_requirements'] ?? null) : null,
            'sponsor_contact_email' => $data['need_sponsor'] ? ($data['sponsor_contact_email'] ?? null) : null,
            'sponsor_contact_phone' => $data['need_sponsor'] ? ($data['sponsor_contact_phone'] ?? null) : null,
            // Timeline fields
            'team_joining_start' => $data['team_joining_start'],
            'team_joining_end' => $data['team_joining_end'],
            'submission_start' => $data['submission_start'] ?? null,
            'submission_end' => $data['submission_end'] ?? $data['judging_start'] ?? null, // Submission ends when judging starts
            'mentor_assignment_start' => $data['mentor_assignment_start'],
            'mentor_assignment_end' => $data['mentor_assignment_end'],
            'judging_start' => $data['judging_start'],
            'judging_end' => $data['judging_end'],
            // Legacy deadline fields (set automatically from timeline)
            'team_deadline' => $data['team_joining_end'] ?? ($data['team_deadline'] ?? null),
            'submission_deadline' => $data['submission_end'] ?? ($data['judging_start'] ?? ($data['submission_deadline'] ?? null)),
            'judging_deadline' => $data['judging_end'] ?? ($data['judging_deadline'] ?? null),
            'status' => $data['status'] ?? 'draft',
            'max_team_size' => $data['max_team_size'],  
        ]);

        // Dispatch HackathonPublished event if status is published
        if ($hackathon->status === 'published') {
            event(new HackathonPublished($hackathon));
        }

        return new HackathonResource($hackathon->load('organization'));
    }

    //  Get single hackathon
    public function show(Hackathon $hackathon)
    {
        try {
            // Load relationships - always load organization and creator (organizer)
            $hackathon->load([
                'organization:id,name,slug,logo,owner_id',
                'creator:id,name,email,avatar',
                'categories'
            ]);
            
            $user = request()->user();
            
            if ($user) {
                // If user is organizer or super admin, load more
                if ($hackathon->created_by === $user->id || $user->hasRole('super_admin')) {
                    try {
                        $hackathon->load(['teams.category', 'judges', 'mentors', 'sponsors']);
                    } catch (\Exception $e) {
                        \Log::warning('Failed to load organizer/admin relationships for hackathon: ' . $e->getMessage());
                    }
                }
                
                // If user is judge for this hackathon
                try {
                    if ($hackathon->judges()->where('users.id', $user->id)->exists()) {
                        $hackathon->load(['teams.category', 'submissions']);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to load judge relationships for hackathon: ' . $e->getMessage());
                }
                
                // If user is mentor for this hackathon
                try {
                    if ($hackathon->mentors()->where('users.id', $user->id)->exists()) {
                        $hackathon->load(['teams.category']);
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to load mentor relationships for hackathon: ' . $e->getMessage());
                }
            }

            return new HackathonResource($hackathon);
        } catch (\Exception $e) {
            \Log::error('Error loading hackathon: ' . $e->getMessage(), [
                'hackathon_id' => $hackathon->id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to load hackathon',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // Update hackathon
    public function update(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can update it.');
        }

        // Validate
        $data = $request->validate([
            'organization_id' => ['nullable', 'exists:organizations,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'type' => ['sometimes', 'in:online,in_person,hybrid'],
            'location' => ['nullable', 'string', 'max:500'],
            'need_sponsor' => ['sometimes', 'boolean'],
            'sponsor_visibility' => [
                'nullable',
                'in:public,sponsors_only',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor');
                })
            ],
            'sponsor_listing_expiry' => [
                'nullable',
                'date',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor') && 
                           $request->input('sponsor_visibility') === 'public';
                })
            ],
            'sponsorship_type_preferred' => [
                'nullable',
                'string',
                'in:financial,in_kind,both',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor');
                })
            ],
            'sponsorship_amount_preferred' => ['nullable', 'numeric', 'min:0'],
            'sponsorship_details' => [
                'nullable',
                'string',
                'min:50',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor');
                })
            ],
            'sponsor_benefits_offered' => ['nullable', 'string'],
            'sponsor_requirements' => ['nullable', 'string'],
            'sponsor_contact_email' => [
                'nullable',
                'email',
                Rule::requiredIf(function () use ($request) {
                    return $request->boolean('need_sponsor');
                })
            ],
            'sponsor_contact_phone' => ['nullable', 'string', 'max:20'],
            'has_sponsors' => ['sometimes', 'boolean'],
            'sponsor_logos' => ['nullable', 'array'],
            'sponsor_logos.*' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'],
            // Timeline fields - allow editing even when published
            'team_joining_start' => ['sometimes', 'date'],
            'team_joining_end' => ['sometimes', 'date', 'after_or_equal:team_joining_start'],
            'submission_start' => ['sometimes', 'date', 'after_or_equal:team_joining_start'],
            'submission_end' => ['sometimes', 'date', 'after_or_equal:submission_start'],
            'mentor_assignment_start' => ['sometimes', 'date', 'after_or_equal:team_joining_end'],
            'mentor_assignment_end' => ['sometimes', 'date', 'after_or_equal:mentor_assignment_start'],
            'judging_start' => ['sometimes', 'date', 'after_or_equal:mentor_assignment_end', 'after_or_equal:submission_start'],
            'judging_end' => ['sometimes', 'date', 'after:judging_start'],
            // Legacy deadline fields (for backward compatibility)
            'team_deadline' => ['sometimes', 'date'],
            'submission_deadline' => ['sometimes', 'date'],
            'judging_deadline' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:draft,published,registration_closed,submission_closed,judging,results_published'],
            'max_team_size' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);
        
        // Check organization ownership if organization_id is being updated
        if (isset($data['organization_id'])) {
            $organization = Organization::find($data['organization_id']);
            if (!$organization) {
                abort(422, 'Selected organization does not exist.');
            }
            if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
                abort(403, 'You do not own this organization.');
            }
        }

        // Track status changes for events
        $wasPublished = $hackathon->status === 'published';
        $isNowPublished = isset($data['status']) && $data['status'] === 'published';
        $wasJudging = $hackathon->status === 'judging';
        $isNowJudging = isset($data['status']) && $data['status'] === 'judging';

        // Update slug if title changed
        if (isset($data['title']) && $data['title'] !== $hackathon->title) {
            $baseSlug = Str::slug($data['title']);
            $slug = $baseSlug;
            $counter = 1;
            
            while (Hackathon::where('slug', $slug)->where('id', '!=', $hackathon->id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            
            $data['slug'] = $slug;
        }

        // Handle sponsor logo uploads - allow logos when has_sponsors OR when logos are provided (optional)
        if ($request->hasFile('sponsor_logos')) {
            $sponsorLogos = [];
            $sponsorLogosDir = 'sponsor-logos';
            // Ensure directory exists
            if (!Storage::disk('public')->exists($sponsorLogosDir)) {
                Storage::disk('public')->makeDirectory($sponsorLogosDir);
            }

            foreach ($request->file('sponsor_logos') as $index => $logoFile) {
                if ($logoFile && $logoFile->isValid()) {
                    $fileName = 'sponsor_' . $user->id . '_' . time() . '_' . $index . '.' . $logoFile->getClientOriginalExtension();
                    $path = $logoFile->storeAs($sponsorLogosDir, $fileName, 'public');
                    if ($path) {
                        $sponsorLogos[] = Storage::disk('public')->url($path);
                    }
                }
            }
            
            // If logos are uploaded, set has_sponsors to true and replace sponsor_logos
            if (!empty($sponsorLogos)) {
                $data['has_sponsors'] = true;
                // Replace existing logos with new ones
                $data['sponsor_logos'] = $sponsorLogos;
            }
        }

        // Handle sponsor fields if need_sponsor is false
        if (isset($data['need_sponsor']) && $data['need_sponsor'] == false) {
            $data['sponsor_visibility'] = null;
            $data['sponsor_listing_expiry'] = null;
            $data['sponsorship_type_preferred'] = null;
            $data['sponsorship_amount_preferred'] = null;
            $data['sponsorship_details'] = null;
            $data['sponsor_benefits_offered'] = null;
            $data['sponsor_requirements'] = null;
            $data['sponsor_contact_email'] = null;
            $data['sponsor_contact_phone'] = null;
        } else if (isset($data['need_sponsor']) && $data['need_sponsor'] == true) {
            // Ensure sponsorship fields are set when need_sponsor is true
            if (!isset($data['sponsorship_type_preferred'])) {
                $data['sponsorship_type_preferred'] = $hackathon->sponsorship_type_preferred;
            }
            if (!isset($data['sponsorship_details'])) {
                $data['sponsorship_details'] = $hackathon->sponsorship_details;
            }
            if (!isset($data['sponsor_contact_email'])) {
                $data['sponsor_contact_email'] = $hackathon->sponsor_contact_email;
            }
        }

        // Sync submission_end to judging_start if not explicitly provided
        if (isset($data['judging_start']) && !isset($data['submission_end'])) {
            $data['submission_end'] = $data['judging_start'];
        }
        
        // Sync legacy deadline fields if timeline fields are being updated
        if (isset($data['team_joining_end'])) {
            $data['team_deadline'] = $data['team_joining_end'];
        }
        if (isset($data['submission_end'])) {
            $data['submission_deadline'] = $data['submission_end'];
        } else if (isset($data['judging_start'])) {
            $data['submission_deadline'] = $data['judging_start'];
        }
        if (isset($data['judging_end'])) {
            $data['judging_deadline'] = $data['judging_end'];
        }

        $hackathon->update($data);
        $hackathon->refresh();

        // Load relationships to ensure all details are included in the response
        $hackathon->load(['organization', 'creator', 'categories', 'teams', 'submissions']);

        // Dispatch HackathonPublished event if status changed to published
        if (!$wasPublished && $isNowPublished) {
            event(new HackathonPublished($hackathon));
        }

        // Dispatch JudgingPeriodStarted event if status changed to judging
        if (!$wasJudging && $isNowJudging) {
            event(new \App\Events\JudgingPeriodStarted($hackathon));
        }

        return new HackathonResource($hackathon);
    }

    // Calculate winners and publish results
    public function calculateWinners(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization: only organizer or super_admin
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can calculate winners.');
        }

        // Validate hackathon is in judging phase or results already published
        if (!in_array($hackathon->status, ['judging', 'results_published'])) {
            abort(422, 'Winners can only be calculated during or after the judging phase.');
        }

        // Validate that judging deadline has passed
        if ($hackathon->judging_deadline && Carbon::now()->lessThan($hackathon->judging_deadline)) {
            abort(422, 'Judging deadline has not passed yet.');
        }

        // Load hackathon relationships
        $hackathon->load(['organization', 'creator']);
        
        // Get top 3 submissions by average_score (only submissions with ratings)
        $topSubmissions = Submission::where('hackathon_id', $hackathon->id)
            ->whereNotNull('average_score')
            ->where('average_score', '>', 0)
            ->orderByDesc('average_score')
            ->limit(3)
            ->get();

        DB::transaction(function () use ($hackathon, $topSubmissions, $user) {
            // Reset all winner flags first
            Submission::where('hackathon_id', $hackathon->id)
                ->update([
                    'is_winner' => false,
                    'winner_position' => null,
                ]);

            // Mark winners with positions and create certificates
            foreach ($topSubmissions as $index => $submission) {
                $position = $index + 1;
                $submission->update([
                    'is_winner' => true,
                    'winner_position' => $position,
                ]);
                
                // Load team with members for certificate creation
                $submission->load('team.members');
                
                // Create certificates for each team member (including solo participants)
                if ($submission->team) {
                    $members = $submission->team->members;
                    foreach ($members as $member) {
                        $certificate = Certificate::create([
                            'hackathon_id' => $hackathon->id,
                            'submission_id' => $submission->id,
                            'team_id' => $submission->team_id,
                            'user_id' => $member->id,
                            'winner_position' => $position,
                            'certificate_number' => Certificate::generateCertificateNumber($hackathon->id, $position),
                            'issued_date' => now(),
                            'is_issued' => true,
                        ]);

                        // Dispatch CertificateAvailable event (triggers email)
                        event(new CertificateAvailable($certificate));
                    }
                }
            }

            // Update hackathon status to results_published
            $hackathon->update([
                'status' => 'results_published',
            ]);

            // Dispatch ResultsPublished event (triggers emails to participants, team leads, sponsors)
            event(new ResultsPublished($hackathon));
            
            // Auto-create winner announcement blog post
            if ($topSubmissions->count() > 0) {
                // Load team relationships for winners
                $topSubmissions->load('team');
                
                $winnersList = $topSubmissions->map(function ($submission, $index) {
                    $position = $index + 1;
                    $positionText = $position === 1 ? '🥇 1st Place' : ($position === 2 ? '🥈 2nd Place' : '🥉 3rd Place');
                    return "**{$positionText}**: {$submission->team->name} - {$submission->title} (Score: {$submission->average_score})";
                })->join("\n\n");

                $orgName = $hackathon->organization ? $hackathon->organization->name : ($hackathon->creator ? $hackathon->creator->name : 'Unknown');
                
                $blogContent = "## 🏆 Hackathon Winners Announcement\n\n";
                $blogContent .= "We are thrilled to announce the winners of **{$hackathon->title}**!\n\n";
                $blogContent .= "### Winners:\n\n";
                $blogContent .= $winnersList;
                $blogContent .= "\n\n";
                $blogContent .= "Congratulations to all the winners and participants for their outstanding work!\n\n";
                $blogContent .= "**Organization**: {$orgName}\n";
                $blogContent .= "**Hackathon Date**: " . ($hackathon->submission_deadline ? $hackathon->submission_deadline->format('F d, Y') : 'TBD');

                $blogTitle = "Winners of {$hackathon->title}";
                $slug = Str::slug($blogTitle);
                $originalSlug = $slug;
                $count = 1;
                while (BlogPost::where('slug', $slug)->exists()) {
                    $slug = $originalSlug . '-' . $count;
                    $count++;
                }

                BlogPost::create([
                    'author_id' => $user->id,
                    'hackathon_id' => $hackathon->id,
                    'title' => $blogTitle,
                    'slug' => $slug,
                    'excerpt' => "We are excited to announce the winners of {$hackathon->title}!",
                    'content' => $blogContent,
                    'type' => 'winner_announcement',
                    'status' => 'published',
                    'published_at' => now(),
                ]);
            }
        });

        // Load winners with relationships
        $winners = Submission::where('hackathon_id', $hackathon->id)
            ->where('is_winner', true)
            ->with(['team:id,name', 'team.members:id,name,email'])
            ->orderBy('winner_position')
            ->get();

        return response()->json([
            'message' => 'Winners calculated and results published successfully',
            'hackathon' => new HackathonResource($hackathon->refresh()->load(['organization', 'creator'])),
            'winners' => $winners->map(function ($submission) {
                return [
                    'position' => $submission->winner_position,
                    'team_name' => $submission->team->name,
                    'submission_title' => $submission->title,
                    'average_score' => $submission->average_score,
                    'rating_count' => $submission->rating_count,
                    'team_members' => $submission->team->members->map(function ($member) {
                        return [
                            'name' => $member->name,
                            'email' => $member->email,
                        ];
                    }),
                ];
            }),
        ]);
    }

    // Delete hackathon
    public function destroy(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can delete it.');
        }

        // Check if hackathon has teams
        if ($hackathon->teams()->exists()) {
            return response()->json([
                'message' => 'Cannot delete hackathon that has teams. Delete teams first.',
            ], 422);
        }

        $hackathon->delete();

        return response()->noContent();
    }

    // Hackathons needing sponsors
    public function forSponsors(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can access this endpoint.');
        }

        $query = Hackathon::with(['organization:id,name', 'categories:id,hackathon_id,name'])
            ->where('need_sponsor', true)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->where('sponsor_visibility', 'public')
                  ->orWhere('sponsor_visibility', 'sponsors_only');
            })
            ->where(function ($q) {
                $q->where('sponsor_listing_expiry', '>', now())
                  ->orWhereNull('sponsor_listing_expiry');
            })
            ->orderByDesc('created_at');

        return HackathonResource::collection($query->paginate(20));
    }

    // Get organizer's hackathons (drafts + published)
    public function organizerHackathons(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasAnyRole(['organizer', 'super_admin'])) {
            abort(403, 'Only organizers can access this endpoint.');
        }

        $query = Hackathon::with(['organization:id,name', 'categories:id,hackathon_id,name'])
            ->where('created_by', $user->id)
            ->orderByDesc('created_at');

        return HackathonResource::collection($query->paginate(50));
    }
}