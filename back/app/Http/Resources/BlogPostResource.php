<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\AvatarHelper;

class BlogPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'featured_image' => $this->featured_image,
            'type' => $this->type,
            'status' => $this->status,
            'views' => $this->views,
            'meta_keywords' => $this->meta_keywords,
            'meta_description' => $this->meta_description,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'author' => $this->whenLoaded('author', function () {
                return [
                    'id' => $this->author->id,
                    'name' => $this->author->name,
                    'avatar' => $this->author->avatar,
                    'avatar_url' => AvatarHelper::generateAvatarUrl($this->author->avatar),
                ];
            }),
            'hackathon' => $this->whenLoaded('hackathon', function () {
                return [
                    'id' => $this->hackathon->id,
                    'title' => $this->hackathon->title,
                    'slug' => $this->hackathon->slug,
                ];
            }),
            'is_published' => $this->is_published,
            'read_time' => $this->getReadTime(),
        ];
    }

    protected function getReadTime()
    {
        $content = strip_tags($this->content ?? '');
        $wordCount = str_word_count($content);
        $minutes = ceil($wordCount / 200); // Average reading speed: 200 words per minute
        return max(1, $minutes);
    }
}
