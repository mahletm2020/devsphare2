<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hackathons', function (Blueprint $table) {
            $table->text('sponsorship_type_preferred')->nullable()->after('sponsor_listing_expiry');
            $table->decimal('sponsorship_amount_preferred', 15, 2)->nullable()->after('sponsorship_type_preferred');
            $table->text('sponsorship_details')->nullable()->after('sponsorship_amount_preferred');
            $table->text('sponsor_benefits_offered')->nullable()->after('sponsorship_details');
            $table->text('sponsor_requirements')->nullable()->after('sponsor_benefits_offered');
            $table->string('sponsor_contact_email')->nullable()->after('sponsor_requirements');
            $table->string('sponsor_contact_phone')->nullable()->after('sponsor_contact_email');
        });
    }

    public function down(): void
    {
        Schema::table('hackathons', function (Blueprint $table) {
            $table->dropColumn([
                'sponsorship_type_preferred',
                'sponsorship_amount_preferred',
                'sponsorship_details',
                'sponsor_benefits_offered',
                'sponsor_requirements',
                'sponsor_contact_email',
                'sponsor_contact_phone',
            ]);
        });
    }
};
