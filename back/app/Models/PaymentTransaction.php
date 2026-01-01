<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'ad_request_id',
        'tx_ref',
        'amount',
        'currency',
        'status',
        'chapa_transaction_id',
        'chapa_response',
        'paid_at',
    ];

    protected $casts = [
        'chapa_response' => 'array',
        'paid_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function adRequest()
    {
        return $this->belongsTo(AdRequest::class);
    }
}
