<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('submissions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('hackathon_id')->constrained()->onDelete('cascade');
        $table->foreignId('team_id')->constrained()->onDelete('cascade');
        $table->string('title');
        $table->text('description');
        $table->string('github_url');
        $table->string('video_url');
        $table->string('live_url')->nullable();
        $table->string('file_path')->nullable();
        $table->decimal('average_score', 5, 2)->nullable();
        $table->integer('rating_count')->default(0);
        $table->timestamp('submitted_at');
        $table->boolean('is_winner')->default(false);
        $table->integer('winner_position')->nullable();
        $table->timestamps();
        
        // One submission per team
        $table->unique('team_id');
        
        // Add indexes
        $table->index(['hackathon_id', 'average_score']);
        $table->index(['is_winner', 'winner_position']);
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};





















