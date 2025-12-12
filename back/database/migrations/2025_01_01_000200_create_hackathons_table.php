<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hackathons', function (Blueprint $table) {
            $table->id();
            // Creator/organizer is a user (organizer = organization)
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description');
            $table->enum('type', ['online', 'in_person', 'hybrid']);
            $table->boolean('need_sponsor')->default(false);
            $table->enum('sponsor_visibility', ['public', 'sponsors_only'])->default('public');
            $table->dateTime('sponsor_listing_expiry')->nullable();
            $table->dateTime('team_deadline');
            $table->dateTime('submission_deadline');
            $table->dateTime('judging_deadline');
            $table->enum('status', [
                'draft',
                'published',
                'registration_closed',
                'submission_closed',
                'judging',
                'results_published',
            ])->default('draft');
            $table->unsignedInteger('max_team_size')->default(4);
            $table->timestamps();

            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hackathons');
    }
};
