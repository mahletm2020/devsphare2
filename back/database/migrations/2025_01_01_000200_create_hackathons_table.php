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
        $table->foreignId('organization_id')->nullable()->constrained()->onDelete('set null');
        $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
        $table->string('title');
        $table->string('slug')->unique();
        $table->text('description');
        $table->enum('type', ['online', 'in_person', 'hybrid']);
        $table->boolean('need_sponsor')->default(false);
        $table->enum('sponsor_visibility', ['public', 'sponsors_only'])->nullable();
        $table->timestamp('sponsor_listing_expiry')->nullable();
        $table->timestamp('team_deadline')->nullable();
        $table->timestamp('submission_deadline')->nullable();
        $table->timestamp('judging_deadline')->nullable();
        $table->enum('status', [
            'draft', 
            'published', 
            'registration_closed', 
            'submission_closed', 
            'judging', 
            'results_published'
        ])->default('draft');
        $table->integer('max_team_size')->default(5);
        $table->timestamps();
    });
    }

    public function down(): void
    {
        Schema::dropIfExists('hackathons');
    }
};





















