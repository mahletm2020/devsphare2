<?php

namespace App\Events;

use App\Models\Hackathon;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JudgingPeriodStarted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Hackathon $hackathon
    ) {}
}




