<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('hackathons', function (Blueprint $table) {
            // Team joining phase
            $table->timestamp('team_joining_start')->nullable()->after('team_deadline');
            $table->timestamp('team_joining_end')->nullable()->after('team_joining_start');
            
            // Mentor assignment phase
            $table->timestamp('mentor_assignment_start')->nullable()->after('team_joining_end');
            $table->timestamp('mentor_assignment_end')->nullable()->after('mentor_assignment_start');
            
            // Submission phase
            $table->timestamp('submission_start')->nullable()->after('submission_deadline');
            $table->timestamp('submission_end')->nullable()->after('submission_start');
            
            // Submission-Judging gap
            $table->integer('submission_judging_gap_hours')->default(24)->after('submission_end');
            
            // Judging phase
            $table->timestamp('judging_start')->nullable()->after('submission_judging_gap_hours');
            $table->timestamp('judging_end')->nullable()->after('judging_start');
            
            // Winner announcement
            $table->timestamp('winner_announcement_time')->nullable()->after('judging_end');
            
            // Lifecycle status (auto-calculated)
            $table->enum('lifecycle_status', [
                'upcoming',
                'team_joining',
                'mentor_assignment',
                'submission',
                'submission_judging_gap',
                'judging',
                'ended'
            ])->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hackathons', function (Blueprint $table) {
            $table->dropColumn([
                'team_joining_start',
                'team_joining_end',
                'mentor_assignment_start',
                'mentor_assignment_end',
                'submission_start',
                'submission_end',
                'submission_judging_gap_hours',
                'judging_start',
                'judging_end',
                'winner_announcement_time',
                'lifecycle_status',
            ]);
        });
    }
};
