<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use App\Models\BlogPostLike;
use App\Models\BlogComment;
use App\Models\Hackathon;
use App\Helpers\AvatarHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BlogPostController extends Controller
{
    // INDEX - Get all published blog posts
    public function index(Request $request)
    {
        $query = BlogPost::published()
            ->with(['author:id,name,avatar', 'hackathon:id,title'])
            ->recent();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $posts = $query->paginate($request->get('per_page', 12));

        return BlogPostResource::collection($posts);
    }

    // SHOW - Get single blog post (by slug via route model binding)
    public function show(BlogPost $blogPost)
    {
        // Only show published posts to public, unless user is author or admin
        $user = request()->user();
        
        if (!$blogPost->is_published) {
            if (!$user || ($blogPost->author_id !== $user->id && !$user->hasRole('super_admin'))) {
                abort(404);
            }
        }

        // Increment views for published posts only once per user
        // Use cookie to prevent duplicate counts (expires in 5 minutes)
        $cookie = null;
        if ($blogPost->is_published) {
            $cookieName = 'blog_viewed_' . $blogPost->id;
            
            // Only increment if cookie doesn't exist (not viewed in last 5 minutes)
            if (!request()->cookie($cookieName)) {
                $blogPost->increment('views');
                // Create cookie that expires in 5 minutes to prevent duplicate counts from rapid refreshes
                $cookie = cookie($cookieName, '1', 5); // 5 minutes = 300 seconds
            }
            // Refresh to get updated view count
            $blogPost->refresh();
        }

        $blogPost->load(['author:id,name,avatar,email', 'hackathon:id,title,slug']);

        $response = response()->json(new BlogPostResource($blogPost));
        
        // Attach cookie to response if it was set
        if ($cookie) {
            $response->cookie($cookie);
        }
        
        return $response;
    }

    // STORE - Create new blog post
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'featured_image' => ['nullable'],
            'type' => ['required', Rule::in(['general', 'winner_announcement'])],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'hackathon_id' => ['nullable', 'exists:hackathons,id'],
            'meta_keywords' => ['nullable', 'array'],
            'meta_keywords.*' => ['string', 'max:50'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'published_at' => ['nullable', 'date'],
        ]);

        // Handle featured image file upload
        $featuredImagePath = null;
        if ($request->hasFile('featured_image')) {
            $file = $request->file('featured_image');
            $fileName = 'blog_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $featuredImagePath = $file->storeAs('blog-images', $fileName, 'public');
            $data['featured_image'] = Storage::disk('public')->url($featuredImagePath);
        } elseif (isset($data['featured_image']) && filter_var($data['featured_image'], FILTER_VALIDATE_URL)) {
            // It's a URL, keep it as is
            $data['featured_image'] = $data['featured_image'];
        } else {
            $data['featured_image'] = null;
        }

        // For winner announcements, validate hackathon
        if ($data['type'] === 'winner_announcement' && !isset($data['hackathon_id'])) {
            return response()->json([
                'message' => 'Hackathon ID is required for winner announcements.',
            ], 422);
        }

        // If hackathon_id is provided, verify it exists and has winners
        if (isset($data['hackathon_id'])) {
            $hackathon = Hackathon::find($data['hackathon_id']);
            if (!$hackathon) {
                return response()->json([
                    'message' => 'Hackathon not found.',
                ], 404);
            }

            // For winner announcements, check if hackathon has winners
            if ($data['type'] === 'winner_announcement') {
                $hasWinners = $hackathon->submissions()
                    ->where('is_winner', true)
                    ->exists();
                
                if (!$hasWinners) {
                    return response()->json([
                        'message' => 'This hackathon has no winners yet. Calculate winners first.',
                    ], 422);
                }
            }
        }

        $data['author_id'] = $user->id;
        $data['slug'] = Str::slug($data['title']);
        
        // Ensure unique slug
        $originalSlug = $data['slug'];
        $count = 1;
        while (BlogPost::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $originalSlug . '-' . $count;
            $count++;
        }

        $blogPost = BlogPost::create($data);

        return new BlogPostResource($blogPost->load(['author:id,name,avatar', 'hackathon:id,title']));
    }

    // UPDATE - Update blog post (by ID)
    public function update(Request $request, $id)
    {
        $blogPost = BlogPost::findOrFail($id);
        $user = $request->user();

        // Authorization: only author or super admin
        if ($blogPost->author_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You can only edit your own blog posts.');
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['sometimes', 'string'],
            'featured_image' => ['nullable'],
            'type' => ['sometimes', Rule::in(['general', 'winner_announcement'])],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'hackathon_id' => ['nullable', 'exists:hackathons,id'],
            'meta_keywords' => ['nullable', 'array'],
            'meta_keywords.*' => ['string', 'max:50'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'published_at' => ['nullable', 'date'],
        ]);

        // Handle featured image file upload
        if ($request->hasFile('featured_image')) {
            // Delete old image if it exists
            if ($blogPost->featured_image) {
                // Extract path from URL if it's stored locally
                $oldPath = str_replace(Storage::disk('public')->url(''), '', $blogPost->featured_image);
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            
            $file = $request->file('featured_image');
            $fileName = 'blog_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $featuredImagePath = $file->storeAs('blog-images', $fileName, 'public');
            $data['featured_image'] = Storage::disk('public')->url($featuredImagePath);
        } elseif (isset($data['featured_image']) && filter_var($data['featured_image'], FILTER_VALIDATE_URL)) {
            // It's a URL, keep it as is
            $data['featured_image'] = $data['featured_image'];
        } elseif (!isset($data['featured_image']) || $data['featured_image'] === '') {
            // Don't update featured_image if not provided
            unset($data['featured_image']);
        }

        // If title changed, update slug
        if (isset($data['title']) && $data['title'] !== $blogPost->title) {
            $data['slug'] = Str::slug($data['title']);
            
            // Ensure unique slug
            $originalSlug = $data['slug'];
            $count = 1;
            while (BlogPost::where('slug', $data['slug'])->where('id', '!=', $blogPost->id)->exists()) {
                $data['slug'] = $originalSlug . '-' . $count;
                $count++;
            }
        }

        // For winner announcements, validate hackathon
        if (isset($data['type']) && $data['type'] === 'winner_announcement') {
            $hackathonId = $data['hackathon_id'] ?? $blogPost->hackathon_id;
            
            if (!$hackathonId) {
                return response()->json([
                    'message' => 'Hackathon ID is required for winner announcements.',
                ], 422);
            }

            $hackathon = Hackathon::find($hackathonId);
            if ($hackathon) {
                $hasWinners = $hackathon->submissions()
                    ->where('is_winner', true)
                    ->exists();
                
                if (!$hasWinners) {
                    return response()->json([
                        'message' => 'This hackathon has no winners yet.',
                    ], 422);
                }
            }
        }

        $blogPost->update($data);

        return new BlogPostResource($blogPost->refresh()->load(['author:id,name,avatar', 'hackathon:id,title']));
    }

    // DESTROY - Delete blog post (by ID)
    public function destroy($id)
    {
        $blogPost = BlogPost::findOrFail($id);
        $user = request()->user();

        // Authorization: only author or super admin
        if ($blogPost->author_id !== $user->id && !$user->hasRole('super_admin')) {
            abort(403, 'You can only delete your own blog posts.');
        }

        $blogPost->delete();

        return response()->noContent();
    }

    // Get user's blog posts
    public function myPosts(Request $request)
    {
        $user = $request->user();

        $query = BlogPost::where('author_id', $user->id)
            ->with(['hackathon:id,title'])
            ->recent();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $posts = $query->paginate($request->get('per_page', 12));

        return BlogPostResource::collection($posts);
    }

    // Get hackathon winners for winner announcement
    public function hackathonWinners(Hackathon $hackathon)
    {
        $winners = $hackathon->submissions()
            ->where('is_winner', true)
            ->with([
                'team:id,name',
                'team.members:id,name,avatar',
                'ratings' => function ($query) {
                    $query->select('id', 'submission_id', 'judge_id', 'total_score', 'comments')
                          ->with('judge:id,name');
                }
            ])
            ->orderBy('winner_position')
            ->get();

        return response()->json([
            'hackathon' => [
                'id' => $hackathon->id,
                'title' => $hackathon->title,
                'description' => $hackathon->description,
            ],
            'winners' => $winners->map(function ($submission) {
                return [
                    'position' => $submission->winner_position,
                    'team_name' => $submission->team->name,
                    'submission_title' => $submission->title,
                    'submission_description' => $submission->description,
                    'average_score' => $submission->average_score,
                    'github_url' => $submission->github_url,
                    'live_url' => $submission->live_url,
                    'video_url' => $submission->video_url,
                    'team_members' => $submission->team->members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'avatar' => $member->avatar,
                        ];
                    }),
                ];
            }),
        ]);
    }

    // TOGGLE LIKE/DISLIKE - Toggle reaction on a blog post
    public function toggleReaction(Request $request, BlogPost $blogPost)
    {
        $user = $request->user();
        
        if (!$user) {
            abort(401, 'You must be logged in to react to posts.');
        }

        $data = $request->validate([
            'reaction' => ['required', Rule::in(['like', 'dislike'])],
        ]);

        // Use updateOrCreate to ensure uniqueness - user can only have ONE reaction (like OR dislike)
        $existingReaction = BlogPostLike::where('blog_post_id', $blogPost->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingReaction) {
            // If same reaction, remove it (toggle off)
            if ($existingReaction->reaction === $data['reaction']) {
                $existingReaction->delete();
            } else {
                // Different reaction - update it (switch from like to dislike or vice versa)
                $existingReaction->update(['reaction' => $data['reaction']]);
            }
        } else {
            // Create new reaction (user's first reaction to this post)
            BlogPostLike::create([
                'blog_post_id' => $blogPost->id,
                'user_id' => $user->id,
                'reaction' => $data['reaction'],
            ]);
        }

        // Refresh to get updated counts
        $blogPost->refresh();
        
        // Get fresh counts
        $likesCount = $blogPost->likes()->where('reaction', 'like')->count();
        $dislikesCount = $blogPost->likes()->where('reaction', 'dislike')->count();
        
        // Check current user's reaction after update
        $currentReaction = BlogPostLike::where('blog_post_id', $blogPost->id)
            ->where('user_id', $user->id)
            ->value('reaction');

        return response()->json([
            'message' => $existingReaction && $existingReaction->reaction === $data['reaction'] 
                ? 'Reaction removed' 
                : ($existingReaction ? 'Reaction updated' : 'Reaction added'),
            'reaction' => $currentReaction,
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
        ]);
    }

    // GET REACTIONS - Get reactions for a blog post
    public function getReactions(BlogPost $blogPost)
    {
        $user = request()->user();
        
        // Get fresh counts - each user can only have ONE reaction (like OR dislike, not both)
        // The unique constraint ensures: one user = one reaction per post
        $likesCount = $blogPost->likes()->where('reaction', 'like')->count();
        $dislikesCount = $blogPost->likes()->where('reaction', 'dislike')->count();
        
        // Get current user's reaction (if any) - will be null, 'like', or 'dislike'
        // Only ONE reaction per user per post (enforced by unique constraint)
        $userReaction = null;
        if ($user) {
            $userReaction = BlogPostLike::where('blog_post_id', $blogPost->id)
                ->where('user_id', $user->id)
                ->value('reaction'); // Returns the reaction value directly, or null if no reaction
        }

        return response()->json([
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
            'user_reaction' => $userReaction, // null, 'like', or 'dislike' - ensures only ONE reaction per user
        ]);
    }

    // STORE COMMENT - Add a comment to a blog post
    public function storeComment(Request $request, BlogPost $blogPost)
    {
        $user = $request->user();
        
        if (!$user) {
            abort(401, 'You must be logged in to comment.');
        }

        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'exists:blog_comments,id'],
        ]);

        $comment = BlogComment::create([
            'blog_post_id' => $blogPost->id,
            'user_id' => $user->id,
            'parent_id' => $data['parent_id'] ?? null,
            'content' => $data['content'],
        ]);

        $comment->load('user:id,name,avatar,email');

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'user' => [
                    'id' => $comment->user->id,
                    'name' => $comment->user->name,
                    'avatar' => $comment->user->avatar,
                    'avatar_url' => AvatarHelper::generateAvatarUrl($comment->user->avatar),
                ],
                'parent_id' => $comment->parent_id,
            ],
        ], 201);
    }

    // GET COMMENTS - Get comments for a blog post
    public function getComments(BlogPost $blogPost)
    {
        try {
            $comments = $blogPost->comments()
                ->with(['user:id,name,avatar,email', 'replies.user:id,name,avatar,email'])
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'comments' => $comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'created_at' => $comment->created_at,
                        'user' => $comment->user ? [
                            'id' => $comment->user->id,
                            'name' => $comment->user->name,
                            'avatar' => $comment->user->avatar,
                            'avatar_url' => AvatarHelper::generateAvatarUrl($comment->user->avatar),
                        ] : null,
                        'replies' => $comment->replies->map(function ($reply) {
                            return [
                                'id' => $reply->id,
                                'content' => $reply->content,
                                'created_at' => $reply->created_at,
                                'user' => $reply->user ? [
                                    'id' => $reply->user->id,
                                    'name' => $reply->user->name,
                                    'avatar' => $reply->user->avatar,
                                    'avatar_url' => AvatarHelper::generateAvatarUrl($reply->user->avatar),
                                ] : null,
                                'parent_id' => $reply->parent_id,
                            ];
                        }),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching comments', [
                'blog_post_id' => $blogPost->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error fetching comments',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // DELETE COMMENT - Delete a comment
    public function deleteComment(BlogPost $blogPost, BlogComment $comment)
    {
        $user = request()->user();
        
        if (!$user) {
            abort(401, 'You must be logged in to delete comments.');
        }
        
        // Authorization: only comment owner or post author or admin
        if ($comment->user_id !== $user->id && 
            $blogPost->author_id !== $user->id && 
            !$user->hasRole('super_admin')) {
            abort(403, 'You can only delete your own comments.');
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }
}
