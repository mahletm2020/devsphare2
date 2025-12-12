<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Hackathon;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request, Hackathon $hackathon)
    {
        $user = $request->user();

        if ($hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category = $hackathon->categories()->create($data);

        return new CategoryResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $user = $request->user();

        if ($category->hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $data = $request->validate([
            //sometimes: Rule only applies if field is present in request Allows partial updates (PATCH-style)
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($data);

        return new CategoryResource($category->refresh());
    }

    public function destroy(Request $request, Category $category)
    {
        $user = $request->user();

        if ($category->hackathon->organizer_id !== $user->id && ! $user->hasRole('super_admin')) {
            abort(403);
        }

        $category->delete();

        return response()->noContent();
    }
}


