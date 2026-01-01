<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hackathon_id')->constrained()->onDelete('cascade');
            $table->foreignId('submission_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Winner user
            $table->integer('winner_position'); // 1st, 2nd, 3rd
            $table->string('certificate_template')->nullable(); // Path to certificate template/image
            $table->text('certificate_data')->nullable(); // JSON data for certificate fields
            $table->string('certificate_number')->unique(); // Unique certificate number
            $table->date('issued_date');
            $table->boolean('is_issued')->default(false);
            $table->timestamps();
            
            $table->index(['hackathon_id', 'user_id']);
            $table->index('certificate_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
