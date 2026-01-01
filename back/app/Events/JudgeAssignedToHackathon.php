<?php

namespace App\Events;

use App\Models\Hackathon;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class JudgeAssignedToHackathon
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Hackathon $hackathon,
        public User $judge
    ) {}
}




