<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\HackathonResource;
use App\Models\Hackathon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HackathonController extends Controller
{
    public function index(Request $request)
    {
        $query = Hackathon::with('organizer')
            ->when($request->created_by, fn($q,$id)=>$q->where('created_by',$id))
            ->when($request->type, fn($q,$type)=>$q->where('type',$type))
            ->when($request->category, function ($q,$category){
                $q->whereHas('categories', fn($cq) => $cq->where('name','like','%'.$category.'%'));
            });

        return HackathonResource::collection($query->orderByDesc('created_at')->paginate());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['organizer','super_admin'])) {
            abort(403, 'Only organizers can create hackathons.');
        }

        $data = $request->validate([
            'title' => ['required','string','max:255'],
            'description' => ['required','string'],
            'type' => ['required','in:online,in_person,hybrid'],
            'need_sponsor' => ['boolean'],
            'sponsor_visibility' => ['sometimes','in:public,sponsors_only'],
            'sponsor_listing_expiry' => ['nullable','date'],
            'team_deadline' => ['required','date'],
            'submission_deadline' => ['required','date','after:team_deadline'],
            'judging_deadline' => ['required','date','after:submission_deadline'],
            'status' => ['sometimes','in:draft,published,registration_closed,submission_closed,judging,results_published'],
            'max_team_size' => ['required','integer','min:1'],
        ]);

        $data['created_by'] = $user->id;
        do {
            $slug = Str::slug($data['title']) . '-' . Str::random(6);
        } while (Hackathon::where('slug', $slug)->exists());
        
        $data['slug'] = $slug;
        $hackathon = Hackathon::create($data);

        return new HackathonResource($hackathon->load('organizer'));
    }

    public function show(Hackathon $hackathon)
    {
        $hackathon->load('organizer','categories','teams');
        return new HackathonResource($hackathon);
    }

    public function update(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        if ($hackathon->created_by !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['sometimes','string','max:255'],
            'description' => ['sometimes','string'],
            'type' => ['sometimes','in:online,in_person,hybrid'],
            'need_sponsor' => ['sometimes','boolean'],
            'sponsor_visibility' => ['sometimes','in:public,sponsors_only'],
            'sponsor_listing_expiry' => ['nullable','date'],
            'team_deadline' => ['sometimes','date'],
            'submission_deadline' => ['sometimes','date'],
            'judging_deadline' => ['sometimes','date'],
            'status' => ['sometimes','in:draft,published,registration_closed,submission_closed,judging,results_published'],
            'max_team_size' => ['sometimes','integer','min:1'],
        ]);

        $hackathon->update($data);

        return new HackathonResource($hackathon->refresh()->load('organizer'));
    }

    public function destroy(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();
        if ($hackathon->created_by !== $user->id && ! $user->hasRole('super_admin')) abort(403);
        $hackathon->delete();
        return response()->noContent();
    }
}
