<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Hackathon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use App\Events\UserRegistered;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        // Validate input
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'required|in:participant,organizer,sponsor',
        ]);

        // Create user
        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verification_token' => Str::random(60),
        ]);

        // Assign role
        $user->assignRole($validated['role']);

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Dispatch UserRegistered event (triggers email verification)
        event(new UserRegistered($user));

        return response()->json([
            'user' => $user->load(['roles']),
            'token' => $token,
            'message' => 'Registration successful. Please verify your email.'
        ], 201);
    }

    // LOGIN
    public function login(Request $request)
    {
        // Log incoming request for debugging
        \Log::info('Login attempt', [
            'email' => $request->input('email'),
            'has_password' => $request->has('password'),
            'content_type' => $request->header('Content-Type'),
            'all_data' => $request->all()
        ]);

        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string'
        ], [
            'email.required' => 'The email field is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'The password field is required.',
        ]);

        // Use case-insensitive email lookup
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($validated['email'])])->first();

        // Check credentials
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Check if email is verified (optional for V2)
        // if (!$user->hasVerifiedEmail()) {
        //     return response()->json(['message' => 'Please verify your email first.'], 403);
        // }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load(['roles']),
            'token' => $token
        ]);
    }

    // LOGGED USER
    public function me(Request $request)
    {
        try {
            $user = $request->user()->load(['roles']);
            
            // Add role-specific data
            if ($user->hasRole('organizer')) {
                try {
                    $user->load(['ownedOrganizations']);
                } catch (\Exception $e) {
                    \Log::warning('Failed to load organizations for user: ' . $e->getMessage());
                }
            }
            
            if ($user->hasRole('participant')) {
                try {
                    $user->load(['teams' => function ($query) {
                        $query->whereHas('hackathon', function ($q) {
                            $q->where('status', '!=', 'results_published');
                        });
                    }]);
                } catch (\Exception $e) {
                    \Log::warning('Failed to load teams for participant: ' . $e->getMessage());
                    // Set empty teams array if loading fails
                    $user->setRelation('teams', collect([]));
                }
            }
            
            // Load judge and mentor assignments for all users
            try {
                $user->load(['judgeHackathons', 'mentorHackathons']);
            } catch (\Exception $e) {
                \Log::warning('Failed to load judge/mentor assignments: ' . $e->getMessage());
                $user->setRelation('judgeHackathons', collect([]));
                $user->setRelation('mentorHackathons', collect([]));
            }
            
            // Add avatar URL if avatar exists
            $userData = $user->toArray();
            if ($user->avatar) {
                try {
                    // Generate avatar URL - ensure it includes the correct base URL
                    $baseUrl = config('app.url', env('APP_URL', 'http://localhost:8000'));
                    $avatarUrl = Storage::disk('public')->url($user->avatar);
                    
                    // If Storage::url() doesn't include the full URL, prepend base URL
                    if (strpos($avatarUrl, 'http') !== 0) {
                        $avatarUrl = rtrim($baseUrl, '/') . '/' . ltrim($avatarUrl, '/');
                    }
                    
                    $userData['avatar_url'] = $avatarUrl;
                } catch (\Exception $e) {
                    \Log::warning('Failed to generate avatar URL: ' . $e->getMessage());
                }
            }
            
            return $userData;
        } catch (\Exception $e) {
            \Log::error('Error in me() method: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to load user data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // LOGOUT
    public function logout(Request $request)
    {
        try {
            // Delete the current access token
            $request->user()->currentAccessToken()->delete();
            
            \Log::info('User logged out', [
                'user_id' => $request->user()->id,
                'email' => $request->user()->email
            ]);

            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Logout error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()->id ?? null
            ]);
            
            // Still return success even if token deletion fails
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        }
    }

    // EMAIL VERIFICATION (V2 placeholder)
    public function verifyEmail(Request $request, $token)
    {
        $user = User::where('email_verification_token', $token)->first();
        
        if (!$user) {
            return response()->json(['message' => 'Invalid verification token'], 400);
        }
        
        $user->update([
            'email_verified_at' => now(),
            'email_verification_token' => null,
        ]);
        
        return response()->json(['message' => 'Email verified successfully']);
    }

    // GOOGLE OAUTH
    public function google(Request $request)
    {
        try {
            $validated = $request->validate([
                'credential' => 'required|string',
            ]);

            $credential = $validated['credential'];
            
            // Decode the JWT token from Google
            $parts = explode('.', $credential);
            if (count($parts) !== 3) {
                return response()->json(['message' => 'Invalid Google token'], 400);
            }

            // Decode the payload (second part)
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            
            if (!$payload || !isset($payload['email'])) {
                return response()->json(['message' => 'Invalid Google token payload'], 400);
            }

            $email = $payload['email'];
            $name = $payload['name'] ?? $payload['given_name'] ?? 'User';
            $googleId = $payload['sub'] ?? null;
            $avatar = $payload['picture'] ?? null;

            // Check if user exists
            $user = User::where('email', $email)->first();

            if ($user) {
                // User exists, log them in
                $token = $user->createToken('auth_token')->plainTextToken;
                
                return response()->json([
                    'user' => $user->load(['roles']),
                    'token' => $token,
                    'message' => 'Login successful'
                ]);
            } else {
                // Create new user
                $userData = [
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(32)), // Random password for OAuth users
                    'avatar' => $avatar,
                    'email_verified_at' => now(), // Google emails are verified
                ];
                
                // Add google_id if column exists
                if ($googleId && \Schema::hasColumn('users', 'google_id')) {
                    $userData['google_id'] = $googleId;
                }
                
                $user = User::create($userData);

                // Assign default role (participant)
                $user->assignRole('participant');

                // Dispatch UserRegistered event (triggers email verification)
                event(new UserRegistered($user));

                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'user' => $user->load(['roles']),
                    'token' => $token,
                    'message' => 'Registration successful'
                ], 201);
            }
        } catch (\Exception $e) {
            \Log::error('Google OAuth error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Google authentication failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    // PASSWORD RESET REQUEST
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            // Return success even if user doesn't exist (security best practice)
            return response()->json([
                'message' => 'If that email exists, we have sent a password reset link.'
            ]);
        }

        // Generate password reset token
        $token = Str::random(60);
        
        // Store token in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Dispatch PasswordResetRequested event (triggers email)
        event(new \App\Events\PasswordResetRequested($user, $token));

        return response()->json([
            'message' => 'If that email exists, we have sent a password reset link.'
        ]);
    }

    // PASSWORD RESET
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Find password reset record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Check if token is valid (created within last 60 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            \DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.'
            ], 400);
        }

        // Verify token
        if (!Hash::check($validated['token'], $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid reset token.'
            ], 400);
        }

        // Update user password
        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Delete reset token
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Password reset successfully.'
        ]);
    }

    // STATS (public stats for home page)
    public function stats()
    {
        try {
            return response()->json([
                'total_hackathons' => Hackathon::count(),
                'active_hackathons' => Hackathon::where('status', 'published')
                    ->where(function($query) {
                        $query->whereNull('submission_deadline')
                            ->orWhere('submission_deadline', '>', now());
                    })
                    ->count(),
                'total_participants' => User::whereHas('roles', function($q) {
                    $q->where('name', 'participant');
                })->count(),
                'total_users' => User::count(),
                'total_teams' => \App\Models\Team::count(),
                'total_submissions' => \App\Models\Submission::count(),
                'total_organizations' => \App\Models\Organization::count(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
}