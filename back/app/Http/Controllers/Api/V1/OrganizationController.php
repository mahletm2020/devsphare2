<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrganizationResource;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{public function index(Request $request)
    
    {
        $user = $request->user();
    
        if ($user->hasRole('super_admin')) {
            $query = Organization::with('owner');
        } elseif ($user->hasRole('organizer')) {
            $query = Organization::with('owner')->where('owner_id', $user->id);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    
        return OrganizationResource::collection($query->paginate());
    }
    
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);
    
        $user = $request->user();
    
        // Only organizer & super_admin
        if (! $user->hasAnyRole(['organizer', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
    
        $organization = Organization::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']) . '-' . Str::random(6),
            'owner_id' => $user->id,
        ]);
    
        return new OrganizationResource($organization->load('owner'));
    }
    

    public function show(Organization $organization)
    {
        $this->authorize('view', $organization);

        return new OrganizationResource($organization->load('owner', 'hackathons'));
    }

    public function update(Request $request, Organization $organization)
    {
        $this->authorize('update', $organization);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $organization->update($data);

        return new OrganizationResource($organization->refresh()->load('owner'));
    }

    public function destroy(Organization $organization)
    {
        $this->authorize('delete', $organization);

        $organization->delete();

        return response()->noContent();
    }
}




