<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ad_requests', function (Blueprint $table) {
            $table->timestamp('ad_post_end_date')->nullable()->after('reviewed_at');
            $table->enum('payment_status', ['pending', 'paid', 'failed'])->default('pending')->after('ad_post_end_date');
            $table->boolean('is_posted')->default(false)->after('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('ad_requests', function (Blueprint $table) {
            $table->dropColumn(['ad_post_end_date', 'payment_status', 'is_posted']);
        });
    }
};
