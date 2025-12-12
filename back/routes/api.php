<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HackathonController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\MentorAssignmentController;
use App\Http\Controllers\Api\V1\JudgeAssignmentController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\RatingController;
use App\Http\Controllers\Api\V1\UserController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);

        // Hackathon management
        Route::apiResource('hackathons', HackathonController::class);

        // Category management (categories belong to hackathons)
        Route::post('hackathons/{hackathon}/categories', [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

        // Team management
        Route::post('hackathons/{hackathon}/teams', [TeamController::class, 'store']);
        Route::post('teams/{team}/join', [TeamController::class, 'join']);
        Route::post('teams/{team}/leave', [TeamController::class, 'leave']);
        Route::get('teams/{team}', [TeamController::class, 'show']);
        Route::put('teams/{team}/lock', [TeamController::class, 'lock']);
        Route::put('teams/{team}/unlock', [TeamController::class, 'unlock']);
        Route::get('hackathons/{hackathon}/teams', [TeamController::class, 'forHackathon']);

        // Mentor / Judge assignment (team-level)
        Route::post('hackathons/{hackathon}/assign-mentors', [MentorAssignmentController::class, 'assign']);
        Route::post('hackathons/{hackathon}/assign-judges', [JudgeAssignmentController::class, 'assign']);

        // Submission
        Route::post('teams/{team}/submit', [SubmissionController::class, 'store']);
        Route::get('hackathons/{hackathon}/submissions', [SubmissionController::class, 'index']);
        Route::get('submissions/{submission}', [SubmissionController::class, 'show']);

        // Ratings
        Route::post('submissions/{submission}/ratings', [RatingController::class, 'store']);
        Route::get('judge/hackathons', [RatingController::class, 'judgeHackathons']);

        // User search
        Route::get('users', [UserController::class, 'index']);
    });
});
