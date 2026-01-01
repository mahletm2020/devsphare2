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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_request_id')->constrained('ad_requests')->onDelete('cascade');
            $table->string('tx_ref')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('ETB');
            $table->string('status')->default('pending'); // pending, success, failed, cancelled
            $table->string('chapa_transaction_id')->nullable();
            $table->json('chapa_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('tx_ref');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
