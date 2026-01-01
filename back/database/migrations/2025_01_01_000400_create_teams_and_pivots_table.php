<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create teams table
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hackathon_id')->constrained('hackathons')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('leader_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            // Unique team name per hackathon
            $table->unique(['hackathon_id', 'name']);
            $table->index(['hackathon_id', 'category_id']);
        });

        // Team members pivot (participants)
        Schema::create('team_user', function (Blueprint $table) {
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['team_id', 'user_id']); // Composite primary key
        });

        // Team mentors pivot
        Schema::create('team_mentor', function (Blueprint $table) {
            $table->id(); // Add ID for consistency
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['team_id', 'user_id']); // Unique instead of primary
            $table->index(['user_id', 'team_id']); // For reverse lookups
        });

        // Team judges pivot
        Schema::create('team_judge', function (Blueprint $table) {
            $table->id(); // Add ID for consistency
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['team_id', 'user_id']); // Unique instead of primary
            $table->index(['user_id', 'team_id']); // For reverse lookups
        });

        // Optional: Create hackathon-level judge/mentor assignments
        Schema::create('hackathon_judges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hackathon_id')->constrained('hackathons')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['hackathon_id', 'user_id']);
        });

        Schema::create('hackathon_mentors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hackathon_id')->constrained('hackathons')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['hackathon_id', 'user_id']);
        });

        Schema::create('hackathon_sponsors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hackathon_id')->constrained('hackathons')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['hackathon_id', 'user_id']);
        });
    }

    public function down(): void
    {
        // Drop in reverse order
        Schema::dropIfExists('hackathon_sponsors');
        Schema::dropIfExists('hackathon_mentors');
        Schema::dropIfExists('hackathon_judges');
        Schema::dropIfExists('team_judge');
        Schema::dropIfExists('team_mentor');
        Schema::dropIfExists('team_user');
        Schema::dropIfExists('teams');
    }
};




















