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
            $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
            $table->foreignId('judge_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('innovation');
            $table->unsignedTinyInteger('execution');
            $table->unsignedTinyInteger('ux_ui');
            $table->unsignedTinyInteger('feasibility');
            $table->unsignedSmallInteger('total_score');
            $table->timestamps();

            $table->unique(['submission_id', 'judge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
