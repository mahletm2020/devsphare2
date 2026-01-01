<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdRequest extends Model
{
    protected $fillable = [
        'sponsor_id',
        'title',
        'description',
        'headline',
        'ad_copy',
        'link_url',
        'image_url',
        'status',
        'amount',
        'admin_response',
        'reviewed_by',
        'reviewed_at',
        'ad_post_end_date',
        'payment_status',
        'is_posted',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'reviewed_at' => 'datetime',
        'ad_post_end_date' => 'datetime',
        'is_posted' => 'boolean',
    ];

    // Relationships
    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sponsor_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
