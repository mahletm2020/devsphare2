<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('ratings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('submission_id')->constrained()->onDelete('cascade');
        $table->foreignId('judge_id')->constrained('users')->onDelete('cascade');
        $table->integer('innovation')->unsigned();
        $table->integer('execution')->unsigned();
        $table->integer('ux_ui')->unsigned();
        $table->integer('feasibility')->unsigned();
        $table->integer('total_score')->unsigned();
        $table->text('comments')->nullable();
        $table->timestamps();
        
        // One rating per judge per submission
        $table->unique(['submission_id', 'judge_id']);
        
        // Add indexes for faster queries
        $table->index(['judge_id', 'created_at']);
        $table->index(['submission_id', 'total_score']);
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};





















