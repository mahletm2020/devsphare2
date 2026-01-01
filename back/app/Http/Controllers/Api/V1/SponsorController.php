<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HackathonResource;
use App\Models\Hackathon;
use Illuminate\Http\Request;

class SponsorController extends Controller
{
    // Get hackathons sponsored by current user
    public function mySponsoredHackathons(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can access this endpoint.');
        }

        $hackathons = $user->sponsoredHackathons()
            ->with(['organization:id,name', 'categories:id,hackathon_id,name'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return HackathonResource::collection($hackathons);
    }

    // Sponsor a hackathon (simplified - just apply based on organizer's requirements)
    public function sponsorHackathon(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can sponsor hackathons.');
        }

        // Check if hackathon needs sponsors
        if (!$hackathon->need_sponsor) {
            abort(422, 'This hackathon is not seeking sponsors.');
        }

        // Check if hackathon is published
        if ($hackathon->status !== 'published') {
            abort(422, 'Only published hackathons can be sponsored.');
        }

        // Check if already sponsored
        if ($hackathon->sponsors()->where('users.id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are already sponsoring this hackathon.',
                'hackathon' => new HackathonResource($hackathon->load('organization'))
            ], 200);
        }

        // Attach sponsor (simple - no additional form data needed)
        $hackathon->sponsors()->attach($user->id);

        return response()->json([
            'message' => 'Successfully applied to sponsor hackathon.',
            'hackathon' => new HackathonResource($hackathon->refresh()->load('organization'))
        ], 201);
    }

    // Unsponsor a hackathon
    public function unsponsorHackathon(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        
        if (!$user->hasRole('sponsor')) {
            abort(403, 'Only sponsors can unsponsor hackathons.');
        }

        // Check if user is sponsoring
        if (!$hackathon->sponsors()->where('users.id', $user->id)->exists()) {
            abort(422, 'You are not sponsoring this hackathon.');
        }

        // Detach sponsor
        $hackathon->sponsors()->detach($user->id);

        return response()->json([
            'message' => 'Successfully unsponsored hackathon.',
        ], 200);
    }
}














