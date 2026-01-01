<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add status to team_mentor pivot table
        Schema::table('team_mentor', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending')->after('user_id');
        });

        // Add status to team_judge pivot table
        Schema::table('team_judge', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending')->after('user_id');
        });

        // Add status to hackathon_mentors pivot table
        Schema::table('hackathon_mentors', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending')->after('user_id');
        });

        // Add status to hackathon_judges pivot table
        Schema::table('hackathon_judges', function (Blueprint $table) {
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending')->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('team_mentor', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('team_judge', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('hackathon_mentors', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('hackathon_judges', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

