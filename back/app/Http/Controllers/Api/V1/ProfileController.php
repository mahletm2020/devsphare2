<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('roles');

        $data = $user->toArray();
        if ($user->avatar) {
            $data['avatar_url'] = Storage::disk('public')->url($user->avatar);
        }

        return response()->json($data);
    }

    public function update(Request $request)
    {
        try {
            $user = $request->user();

            // Debug: Check all possible ways the file might be sent
            $hasFileAvatar = $request->hasFile('avatar');
            $allFiles = $request->allFiles();
            $inputKeys = array_keys($request->all());
            $fileKeys = array_keys($allFiles);
            
            Log::info('PROFILE UPDATE REQUEST', [
                'user_id' => $user->id,
                'has_file_avatar' => $hasFileAvatar,
                'all_files' => $fileKeys,
                'all_keys' => $inputKeys,
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method(),
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
                'data' => $request->except(['avatar', 'file']),
                'file_info' => $hasFileAvatar ? [
                    'name' => $request->file('avatar')->getClientOriginalName(),
                    'size' => $request->file('avatar')->getSize(),
                    'mime' => $request->file('avatar')->getMimeType(),
                ] : null,
                'raw_files' => !empty($allFiles) ? array_map(function($f) {
                    return $f instanceof \Illuminate\Http\UploadedFile ? [
                        'name' => $f->getClientOriginalName(),
                        'size' => $f->getSize(),
                    ] : 'not_uploaded_file';
                }, $allFiles) : 'no_files',
            ]);

            // Validate request
            try {
                $validated = $request->validate([
                    'name'   => 'sometimes|string|max:255',
                    'bio'    => 'nullable|string|max:1000',
                    'avatar' => 'nullable|image|mimes:jpg,jpeg,png,gif,webp|max:2048',
                ]);
                Log::info('Validation passed', ['validated' => array_keys($validated)]);
            } catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('Validation failed', ['errors' => $e->errors()]);
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }

            $updated = false;

            // Update name if provided
            if (array_key_exists('name', $validated)) {
                $user->name = $validated['name'];
                $updated = true;
                Log::info('Name updated', ['name' => $validated['name']]);
            }

            // Update bio if provided (check both validated and raw request)
            if ($request->has('bio') || array_key_exists('bio', $request->all())) {
                $bioValue = $validated['bio'] ?? ($request->input('bio') === '' ? null : $request->input('bio'));
                $user->bio = $bioValue;
                $updated = true;
                Log::info('Bio updated', ['bio' => $bioValue]);
            }

            // Handle avatar upload
            // Check multiple ways Laravel might receive the file
            $avatarFile = null;
            if ($request->hasFile('avatar')) {
                $avatarFile = $request->file('avatar');
            } elseif (isset($allFiles['avatar'])) {
                $avatarFile = $allFiles['avatar'];
            } elseif ($request->file('avatar')) {
                $avatarFile = $request->file('avatar');
            }
            
            if ($avatarFile && $avatarFile instanceof \Illuminate\Http\UploadedFile) {
                try {
                    $file = $avatarFile;
                    
                    Log::info('Processing avatar file', [
                        'original_name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'extension' => $file->getClientOriginalExtension(),
                        'is_valid' => $file->isValid(),
                        'error' => $file->getError(),
                    ]);

                    // Check if file upload was successful
                    if (!$file->isValid()) {
                        $errorMessages = [
                            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
                        ];
                        $errorMsg = $errorMessages[$file->getError()] ?? 'Unknown upload error';
                        throw new \Exception("File upload failed: {$errorMsg}");
                    }

                    // Delete old avatar if it exists
                    if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                        try {
                            Storage::disk('public')->delete($user->avatar);
                            Log::info('Old avatar deleted', ['path' => $user->avatar]);
                        } catch (\Exception $e) {
                            Log::warning('Failed to delete old avatar', ['error' => $e->getMessage()]);
                            // Continue even if deletion fails
                        }
                    }

                    // Ensure avatars directory exists
                    $avatarsPath = storage_path('app/public/avatars');
                    if (!is_dir($avatarsPath)) {
                        mkdir($avatarsPath, 0755, true);
                        Log::info('Created avatars directory', ['path' => $avatarsPath]);
                    }

                    // Store new avatar
                    $fileName = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('avatars', $fileName, 'public');
                    
                    if (!$path) {
                        throw new \Exception('Failed to store avatar file - storage returned null');
                    }

                    // Verify file was stored
                    if (!Storage::disk('public')->exists($path)) {
                        throw new \Exception('File was not stored correctly - file does not exist after storage');
                    }

                    $user->avatar = $path;
                    $updated = true;
                    Log::info('Avatar uploaded successfully', [
                        'path' => $path,
                        'full_path' => Storage::disk('public')->path($path),
                        'url' => Storage::disk('public')->url($path)
                    ]);
                } catch (\Exception $e) {
                    Log::error('Avatar upload failed', [
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'message' => 'Failed to upload avatar',
                        'error' => $e->getMessage(),
                        'details' => config('app.debug') ? [
                            'file' => $e->getFile(),
                            'line' => $e->getLine(),
                        ] : null
                    ], 500);
                }
            }

            // Save changes
            if ($updated) {
                $user->save();
                Log::info('User saved successfully');
            } else {
                Log::warning('No changes to save');
            }

            // Reload user with relationships
            $user->refresh()->load('roles');

            // Prepare response data
            $data = $user->toArray();
            if ($user->avatar) {
                try {
                    // Generate avatar URL - ensure it includes the correct base URL
                    $baseUrl = config('app.url', env('APP_URL', 'http://localhost:8000'));
                    $avatarUrl = Storage::disk('public')->url($user->avatar);
                    
                    // If Storage::url() doesn't include the full URL, prepend base URL
                    if (strpos($avatarUrl, 'http') !== 0) {
                        $avatarUrl = rtrim($baseUrl, '/') . '/' . ltrim($avatarUrl, '/');
                    }
                    
                    $data['avatar_url'] = $avatarUrl;
                    
                    Log::info('Avatar URL generated', [
                        'path' => $user->avatar,
                        'url' => $avatarUrl,
                        'file_exists' => Storage::disk('public')->exists($user->avatar)
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to generate avatar URL', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Profile update successful', [
                'user_id' => $user->id,
                'has_avatar' => !empty($user->avatar)
            ]);

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Profile update exception', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->avatar = null;
        $user->save();

        return response()->json([
            'message' => 'Avatar deleted successfully',
        ]);
    }
}
