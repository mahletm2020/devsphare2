<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SystemFailureCritical
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $message,
        public array $context = []
    ) {}
}




