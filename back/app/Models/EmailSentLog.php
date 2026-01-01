<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailSentLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'duplicate_key',
        'recipient_email',
        'subject',
        'event_type',
        'entity_id',
        'sent_at',
        'success',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'success' => 'boolean',
    ];
}




