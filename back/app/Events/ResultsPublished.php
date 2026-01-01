<?php

namespace App\Events;

use App\Models\Hackathon;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResultsPublished
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Hackathon $hackathon
    ) {}
}




