<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Hackathon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    // STORE - Create category for hackathon
    public function store(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        // Authorization
        if ($hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can create categories.');
        }

        // Validate
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 
                Rule::unique('categories')->where(function ($query) use ($hackathon) {
                    return $query->where('hackathon_id', $hackathon->id);
                })
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'max_teams' => ['nullable', 'integer', 'min:1'],
        ]);

        // Create category
        $category = $hackathon->categories()->create($data);

        return new CategoryResource($category);
    }

    // UPDATE - Update category
    public function update(Request $request, Category $category)
    {
        $user = $request->user();

        // Authorization - load hackathon relationship
        $category->load('hackathon');
        
        if ($category->hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can update categories.');
        }

        // Validate
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255',
                Rule::unique('categories')->where(function ($query) use ($category) {
                    return $query->where('hackathon_id', $category->hackathon_id)
                                 ->where('id', '!=', $category->id);
                })
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'max_teams' => ['nullable', 'integer', 'min:1'],
        ]);

        // Update category
        $category->update($data);

        return new CategoryResource($category->refresh());
    }

    // DESTROY - Delete category
    public function destroy(Request $request, Category $category)
    {
        $user = $request->user();

        // Authorization - eager load hackathon
        $category->load('hackathon');
        
        if ($category->hackathon->created_by !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'Only the hackathon organizer can delete categories.');
        }

        // Check if category has teams
        if ($category->teams()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that has teams. Remove teams first.',
            ], 422);
        }

        $category->delete();

        return response()->noContent();
    }
}