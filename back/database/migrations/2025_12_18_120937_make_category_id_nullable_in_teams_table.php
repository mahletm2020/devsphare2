<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['category_id']);
            
            // Make category_id nullable
            $table->foreignId('category_id')->nullable()->change();
            
            // Re-add the foreign key constraint with nullable support
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['category_id']);
            
            // Make category_id required again
            $table->foreignId('category_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
        });
    }
};
