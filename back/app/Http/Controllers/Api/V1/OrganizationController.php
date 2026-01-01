<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    // INDEX - List organizations with authorization
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Ensure roles are loaded and refresh from database
        $user->refresh();
        $user->load('roles');
        
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        if ($user->hasRole('super_admin')) {
            $query = Organization::with('owner:id,name,email');
        } elseif ($user->hasRole('organizer')) {
            $query = Organization::with('owner:id,name,email')
                ->where('owner_id', $user->id);
        } else {
            \Log::warning('Organization list unauthorized', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
                'has_organizer' => $user->hasRole('organizer'),
                'has_super_admin' => $user->hasRole('super_admin'),
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Apply search filter
        if (isset($validated['search'])) {
            $query->where('name', 'ilike', "%{$validated['search']}%");
        }

        return OrganizationResource::collection($query->paginate(20));
    }

    // STORE - Create organization
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Ensure roles are loaded and refresh from database
        $user->refresh();
        $user->load('roles');
        
        // Debug logging
        \Log::info('Organization creation attempt', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'roles' => $user->roles->pluck('name')->toArray(),
            'has_organizer' => $user->hasRole('organizer'),
            'has_super_admin' => $user->hasRole('super_admin'),
            'hasAnyRole_check' => $user->hasAnyRole(['organizer', 'super_admin']),
        ]);

        // Authorization: only organizers and super admins
        if (!$user->hasAnyRole(['organizer', 'super_admin'])) {
            \Log::warning('Organization creation unauthorized', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray(),
                'has_organizer' => $user->hasRole('organizer'),
                'has_super_admin' => $user->hasRole('super_admin'),
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:organizations'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'], // 2MB max
        ]);

        // Generate unique slug
        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        $counter = 1;
        
        while (Organization::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        // Handle logo file upload
        $logoPath = null;
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            
            \Log::info('Organization logo upload', [
                'user_id' => $user->id,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_mime' => $file->getMimeType(),
                'is_valid' => $file->isValid(),
            ]);
            
            if ($file->isValid()) {
                $fileName = 'logo_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $logoPath = $file->storeAs('organizations', $fileName, 'public');
                
                \Log::info('Organization logo stored', [
                    'path' => $logoPath,
                    'full_path' => storage_path('app/public/' . $logoPath),
                ]);
            } else {
                \Log::warning('Organization logo file is invalid', [
                    'error' => $file->getError(),
                ]);
            }
        } else {
            \Log::info('No logo file in request', [
                'has_file' => $request->hasFile('logo'),
                'all_files' => array_keys($request->allFiles()),
            ]);
        }

        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'website' => $data['website'] ?? null,
            'logo' => $logoPath,
            'owner_id' => $user->id,
        ]);

        return new OrganizationResource($organization->load('owner'));
    }

    // SHOW - Get single organization
    public function show(Organization $organization)
    {
        $user = request()->user();
        
        // Authorization
        if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You do not have access to this organization.');
        }

        $organization->load([
            'owner:id,name,email,avatar',
            'hackathons' => function ($query) {
                $query->select(['id', 'organization_id', 'title', 'slug', 'status', 'created_at'])
                      ->orderByDesc('created_at')
                      ->limit(10);
            },
            'hackathons.categories:id,hackathon_id,name',
        ]);

        return new OrganizationResource($organization);
    }
    

    //  Update organization
    public function update(Request $request, Organization $organization)
    {
        $user = $request->user();

        // Authorization
        if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You do not have permission to update this organization.');
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 
                Rule::unique('organizations')->ignore($organization->id)
            ],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png', 'max:2048'], // 2MB max
        ]);

        // Handle logo file upload
        if ($request->hasFile('logo')) {
            // Delete old logo if it exists
            if ($organization->logo && Storage::disk('public')->exists($organization->logo)) {
                Storage::disk('public')->delete($organization->logo);
            }
            
            $file = $request->file('logo');
            $fileName = 'logo_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $logoPath = $file->storeAs('organizations', $fileName, 'public');
            $data['logo'] = $logoPath;
        }

        // Update slug if name changed
        if (isset($data['name']) && $data['name'] !== $organization->name) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;
            
            while (Organization::where('slug', $slug)->where('id', '!=', $organization->id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            
            $data['slug'] = $slug;
        }

        $organization->update($data);

        return new OrganizationResource($organization->refresh()->load('owner'));
    }

    // DESTROY - Delete organization
    public function destroy(Request $request, Organization $organization)
    {
        $user = $request->user();

        // Authorization
        if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You do not have permission to delete this organization.');
        }

        // Check if organization has hackathons
        if ($organization->hackathons()->exists()) {
            return response()->json([
                'message' => 'Cannot delete organization that has hackathons. Delete hackathons first.',
            ], 422);
        }

        $organization->delete();

        return response()->noContent();
    }

    // LIST hackathons for organization
    public function hackathons(Organization $organization)
    {
        $user = request()->user();
        
        // Authorization
        if ($organization->owner_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You do not have access to this organization.');
        }

        $hackathons = $organization->hackathons()
            ->with(['categories:id,hackathon_id,name'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'hackathons' => $hackathons,
            'total_hackathons' => $hackathons->total(),
        ]);
    }
}










