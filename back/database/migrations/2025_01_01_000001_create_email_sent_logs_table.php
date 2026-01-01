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
        Schema::create('email_sent_logs', function (Blueprint $table) {
            $table->id();
            $table->string('duplicate_key', 64)->unique()->index();
            $table->string('recipient_email', 255)->index();
            $table->string('subject', 500);
            $table->string('event_type', 100)->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->timestamp('sent_at')->index();
            $table->boolean('success')->default(true);
            $table->text('error_message')->nullable();
            $table->timestamps();

            // Composite index for faster duplicate checks
            $table->index(['duplicate_key', 'sent_at']);
            $table->index(['event_type', 'entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_sent_logs');
    }
};




