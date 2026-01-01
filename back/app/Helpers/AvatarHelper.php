<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;

class AvatarHelper
{
    /**
     * Add avatar_url to a user object or collection
     * 
     * @param mixed $user User model or array
     * @return mixed User with avatar_url added
     */
    public static function addAvatarUrl($user)
    {
        if (is_array($user)) {
            if (isset($user['avatar']) && $user['avatar']) {
                $user['avatar_url'] = self::generateAvatarUrl($user['avatar']);
            }
            return $user;
        }
        
        if (is_object($user) && method_exists($user, 'getAttribute')) {
            // Laravel model
            if ($user->avatar) {
                $user->setAttribute('avatar_url', self::generateAvatarUrl($user->avatar));
            }
            return $user;
        }
        
        return $user;
    }
    
    /**
     * Add avatar_url to a collection of users
     * 
     * @param \Illuminate\Support\Collection $users
     * @return \Illuminate\Support\Collection
     */
    public static function addAvatarUrlToCollection($users)
    {
        if (!$users) {
            return $users;
        }
        
        return $users->map(function ($user) {
            return self::addAvatarUrl($user);
        });
    }
    
    /**
     * Generate avatar URL from avatar path
     * 
     * @param string $avatarPath
     * @return string
     */
    public static function generateAvatarUrl($avatarPath)
    {
        if (!$avatarPath) {
            return null;
        }
        
        try {
            $baseUrl = config('app.url', env('APP_URL', 'http://localhost:8000'));
            $avatarUrl = Storage::disk('public')->url($avatarPath);
            
            // If Storage::url() doesn't include the full URL, prepend base URL
            if (strpos($avatarUrl, 'http') !== 0) {
                $avatarUrl = rtrim($baseUrl, '/') . '/' . ltrim($avatarUrl, '/');
            }
            
            return $avatarUrl;
        } catch (\Exception $e) {
            \Log::warning('Failed to generate avatar URL', [
                'path' => $avatarPath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}











