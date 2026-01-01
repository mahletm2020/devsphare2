<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HackathonController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\MentorAssignmentController;
use App\Http\Controllers\Api\V1\JudgeAssignmentController;
use App\Http\Controllers\Api\V1\AssignmentRequestController;
use App\Http\Controllers\Api\V1\MentorDashboardController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\RatingController;
use App\Http\Controllers\Api\V1\SponsorController;
use App\Http\Controllers\Api\V1\AdRequestController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\BlogPostController;
use App\Http\Controllers\Api\V1\ChatController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'google']); // Google OAuth
    Route::get('/auth/stats', [AuthController::class, 'stats']); // Public stats
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']); // Password reset request
    Route::post('/reset-password', [AuthController::class, 'resetPassword']); // Password reset
    Route::get('/ad-requests/posted', [AdRequestController::class, 'getPostedAds']);
    
    // Payment Callback (Chapa webhook - no auth required)
    Route::post('/payments/callback', [AdRequestController::class, 'paymentCallback'])->name('api.v1.payments.callback');
    
    // Blog Posts - Public routes
    Route::get('/blog-posts', [BlogPostController::class, 'index']);
    Route::get('/blog-posts/{blogPost:slug}', [BlogPostController::class, 'show']);
    Route::get('/blog-posts/{blogPost:slug}/reactions', [BlogPostController::class, 'getReactions']);
    Route::get('/blog-posts/{blogPost:slug}/comments', [BlogPostController::class, 'getComments']);
    Route::get('/hackathons/{hackathon}/winners', [BlogPostController::class, 'hackathonWinners']); // Public posted ads
    
    // Hackathons - Public routes for viewing
    Route::get('/hackathons', [HackathonController::class, 'index']);
    Route::get('/hackathons/{hackathon}', [HackathonController::class, 'show']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'me']);
        
        // Hackathons - specific routes must come before apiResource
        Route::get('/hackathons/for-sponsors', [HackathonController::class, 'forSponsors']);
        Route::get('/organizer/hackathons', [HackathonController::class, 'organizerHackathons']);
        Route::post('/hackathons/{hackathon}/calculate-winners', [HackathonController::class, 'calculateWinners']);
        // Exclude 'index' and 'show' from apiResource since they're already defined as public routes above
        Route::apiResource('hackathons', HackathonController::class)->except(['index', 'show']);
        
        // Organizations
        Route::apiResource('organizations', OrganizationController::class);
        Route::get('/organizations/{organization}/hackathons', [OrganizationController::class, 'hackathons']);
        
        // Categories
        Route::post('/hackathons/{hackathon}/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        
        // Teams
        Route::get('/hackathons/{hackathon}/teams', [TeamController::class, 'forHackathon']);
        Route::post('/hackathons/{hackathon}/teams', [TeamController::class, 'store']);
        Route::apiResource('teams', TeamController::class)->except(['store']);
        Route::post('/teams/{team}/join', [TeamController::class, 'join']);
        Route::post('/teams/{team}/leave', [TeamController::class, 'leave']);
        Route::post('/teams/{team}/lock', [TeamController::class, 'lock']);
        Route::post('/teams/{team}/unlock', [TeamController::class, 'unlock']);
        Route::post('/teams/{team}/transfer-leadership', [TeamController::class, 'transferLeadership']);
        Route::post('/teams/{team}/kick-member', [TeamController::class, 'kickMember']);
        
        // Submissions
        Route::get('/hackathons/{hackathon}/submissions', [SubmissionController::class, 'index']);
        Route::post('/teams/{team}/submissions', [SubmissionController::class, 'store']);
        Route::apiResource('submissions', SubmissionController::class)->except(['store']);
        Route::get('/submissions/{submission}/download', [SubmissionController::class, 'download']);
        Route::get('/submissions/{submission}/download-readme', [SubmissionController::class, 'downloadReadme']);
        Route::get('/submissions/{submission}/download-ppt', [SubmissionController::class, 'downloadPpt']);
        
        // Mentor Assignments
        Route::prefix('hackathons/{hackathon}')->group(function () {
            // Get users who can be mentors (not participants, not already mentors)
            Route::get('/mentor-assignments/potential-mentors', [MentorAssignmentController::class, 'getPotentialMentors']);
            Route::post('/mentor-assignments', [MentorAssignmentController::class, 'assign']);
            Route::post('/mentor-assignments/category', [MentorAssignmentController::class, 'assignToCategory']);
            Route::post('/mentor-assignments/remove', [MentorAssignmentController::class, 'remove']);
            Route::get('/mentor-assignments/mentors', [MentorAssignmentController::class, 'listMentors']);
        });
        
        // Judge Assignments
        Route::prefix('hackathons/{hackathon}')->group(function () {
            // Get users who can be judges (not participants, not already judges)
            Route::get('/judge-assignments/potential-judges', [JudgeAssignmentController::class, 'getPotentialJudges']);
            Route::post('/judge-assignments', [JudgeAssignmentController::class, 'assign']);
            Route::post('/judge-assignments/category', [JudgeAssignmentController::class, 'assignToCategory']);
            Route::post('/judge-assignments/remove', [JudgeAssignmentController::class, 'remove']);
            Route::get('/judge-assignments/judges', [JudgeAssignmentController::class, 'listJudges']);
        });
        
        // Assignment Requests (for mentors/judges to accept/reject)
        Route::get('/assignment-requests/pending', [AssignmentRequestController::class, 'myPendingRequests']);
        Route::post('/assignment-requests/mentor/{assignmentId}/accept', [AssignmentRequestController::class, 'acceptMentorRequest']);
        Route::post('/assignment-requests/mentor/{assignmentId}/reject', [AssignmentRequestController::class, 'rejectMentorRequest']);
        Route::post('/assignment-requests/judge/{assignmentId}/accept', [AssignmentRequestController::class, 'acceptJudgeRequest']);
        Route::post('/assignment-requests/judge/{assignmentId}/reject', [AssignmentRequestController::class, 'rejectJudgeRequest']);
        
        // Mentor Dashboard
        Route::get('/mentor/assigned-teams', [MentorDashboardController::class, 'myAssignedTeams']);
        Route::get('/mentor/teams/{team}', [MentorDashboardController::class, 'getTeamDetails']);
        Route::post('/mentor/teams/{team}/remove-member', [MentorDashboardController::class, 'removeMember']);
        Route::post('/mentor/teams/{team}/transfer-leadership', [MentorDashboardController::class, 'transferLeadership']);
        
        // Ratings (for judges)
        Route::get('/ratings/has-judge-assignments', [RatingController::class, 'hasJudgeAssignments']);
        Route::get('/ratings/judge-hackathons', [RatingController::class, 'judgeHackathons']);
        Route::get('/ratings/hackathons/{hackathon}/submissions', [RatingController::class, 'submissionsToRate']);
        
        // Sponsors
        Route::get('/sponsors/my-sponsored', [SponsorController::class, 'mySponsoredHackathons']);
        Route::post('/hackathons/{hackathon}/sponsor', [SponsorController::class, 'sponsorHackathon']);
        Route::post('/hackathons/{hackathon}/unsponsor', [SponsorController::class, 'unsponsorHackathon']);
        
        // Ad Requests - specific routes must come before apiResource
        Route::get('/ad-requests/my-requests', [AdRequestController::class, 'myRequests']);
        Route::post('/ad-requests/{adRequest}/initialize-payment', [AdRequestController::class, 'initializePayment']);
        Route::get('/ad-requests/{adRequest}/verify-payment', [AdRequestController::class, 'verifyPayment']);
        Route::post('/ad-requests/{adRequest}/pay-and-post', [AdRequestController::class, 'payAndPost']);
        Route::apiResource('ad-requests', AdRequestController::class);
        
        // Chat routes
        Route::get('/chat/token', [ChatController::class, 'getToken']);
        Route::get('/chat/channel/direct/{userId}', [ChatController::class, 'getDirectChannel']);
        Route::get('/chat/channel/team/{teamId}', [ChatController::class, 'getTeamChannel']);
        Route::get('/chat/channel/hackathon/{hackathonId}', [ChatController::class, 'getHackathonChannel']);
        Route::get('/ratings/hackathons/{hackathon}/my-ratings', [RatingController::class, 'myRatings']);
        Route::post('/submissions/{submission}/ratings', [RatingController::class, 'storeOrUpdate']);
        
        // User Search (for organizers to find mentors/judges)
        Route::get('/users/search', [UserController::class, 'search']);
        Route::get('/users/hackathons/{hackathon}/potential-mentors', [UserController::class, 'potentialMentors']);
        Route::get('/users/hackathons/{hackathon}/potential-judges', [UserController::class, 'potentialJudges']);
        Route::get('/users/{user}', [UserController::class, 'profile']); // Get any user's profile
        
        // Super Admin - Get all users by role (authorization checked in controller)
        Route::get('/admin/users/by-role', [UserController::class, 'getAllByRole']);
        
        // Profile Management
        Route::get('/profile', [ProfileController::class, 'show']);
        // Use POST for file uploads (Laravel handles multipart/form-data better with POST)
        Route::post('/profile', [ProfileController::class, 'update']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar']);
        
        // Blog Posts - Authenticated routes
        Route::get('/blog-posts/my-posts', [BlogPostController::class, 'myPosts']);
        Route::post('/blog-posts', [BlogPostController::class, 'store']);
        Route::post('/blog-posts/{id}', [BlogPostController::class, 'update']); // POST for file uploads
        Route::put('/blog-posts/{id}', [BlogPostController::class, 'update']);
        Route::delete('/blog-posts/{id}', [BlogPostController::class, 'destroy']);
        
        // Blog Post Reactions and Comments
        Route::post('/blog-posts/{blogPost}/reactions', [BlogPostController::class, 'toggleReaction']);
        Route::get('/blog-posts/{blogPost}/reactions', [BlogPostController::class, 'getReactions']);
        Route::post('/blog-posts/{blogPost}/comments', [BlogPostController::class, 'storeComment']);
        Route::get('/blog-posts/{blogPost}/comments', [BlogPostController::class, 'getComments']);
        Route::delete('/blog-posts/{blogPost}/comments/{comment}', [BlogPostController::class, 'deleteComment']);
    });
});


