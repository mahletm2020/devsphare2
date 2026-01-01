<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'hackathon_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'type',
        'status',
        'views',
        'meta_keywords',
        'meta_description',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'meta_keywords' => 'array',
        'views' => 'integer',
    ];

    // Use slug for route model binding
    public function getRouteKeyName()
    {
        return 'slug';
    }

    // Boot method to auto-generate slug
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($blogPost) {
            if (empty($blogPost->slug)) {
                $blogPost->slug = Str::slug($blogPost->title);
            }
            
            // If slug already exists, append number
            $originalSlug = $blogPost->slug;
            $count = 1;
            while (static::where('slug', $blogPost->slug)->exists()) {
                $blogPost->slug = $originalSlug . '-' . $count;
                $count++;
            }
        });
    }

    // Relationships
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function hackathon()
    {
        return $this->belongsTo(Hackathon::class);
    }

    public function likes()
    {
        return $this->hasMany(BlogPostLike::class);
    }

    public function comments()
    {
        return $this->hasMany(BlogComment::class)->whereNull('parent_id');
    }

    public function allComments()
    {
        return $this->hasMany(BlogComment::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where(function ($q) {
                        $q->whereNull('published_at')
                          ->orWhere('published_at', '<=', now());
                    });
    }

    public function scopeGeneral($query)
    {
        return $query->where('type', 'general');
    }

    public function scopeWinnerAnnouncements($query)
    {
        return $query->where('type', 'winner_announcement');
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('published_at', 'desc')
                    ->orderBy('created_at', 'desc');
    }

    public function scopePopular($query)
    {
        return $query->orderBy('views', 'desc');
    }

    // Attributes
    public function getIsPublishedAttribute()
    {
        return $this->status === 'published' && 
               ($this->published_at === null || $this->published_at <= now());
    }

    public function incrementViews()
    {
        $this->increment('views');
    }
}
