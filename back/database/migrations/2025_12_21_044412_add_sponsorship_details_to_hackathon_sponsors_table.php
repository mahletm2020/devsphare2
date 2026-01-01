<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hackathon_sponsors', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('user_id');
            $table->string('contact_person')->nullable()->after('company_name');
            $table->string('contact_email')->nullable()->after('contact_person');
            $table->string('contact_phone')->nullable()->after('contact_email');
            $table->enum('sponsorship_type', ['financial', 'in_kind', 'both'])->nullable()->after('contact_phone');
            $table->decimal('sponsorship_amount', 15, 2)->nullable()->after('sponsorship_type');
            $table->text('sponsorship_details')->nullable()->after('sponsorship_amount');
            $table->text('benefits_sought')->nullable()->after('sponsorship_details');
            $table->text('additional_message')->nullable()->after('benefits_sought');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('additional_message');
        });
    }

    public function down(): void
    {
        Schema::table('hackathon_sponsors', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'contact_person',
                'contact_email',
                'contact_phone',
                'sponsorship_type',
                'sponsorship_amount',
                'sponsorship_details',
                'benefits_sought',
                'additional_message',
                'status',
            ]);
        });
    }
};
