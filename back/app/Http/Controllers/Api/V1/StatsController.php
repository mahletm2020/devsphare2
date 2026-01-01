<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;
use App\Models\Hackathon;
use App\Models\User;

class StatsController extends Controller
{

    public function index()
    {
        try {
            return response()->json([
                'totalHackathons' => Hackathon::count(),
                'activeHackathons' => Hackathon::where('status', 'published')->count(),
                'totalParticipants' => User::count(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error: ' . $e->getMessage()], 500);
        }
    }
}
