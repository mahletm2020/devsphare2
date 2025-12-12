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
            $table->foreignId('hackathon_id')->constrained('hackathons')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('github_url');
            $table->string('video_url');
            $table->string('file_path')->nullable();
            $table->timestamps();

            $table->unique('team_id');
            $table->index('hackathon_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
