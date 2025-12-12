<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'search' => ['nullable','string'],
            'role' => ['nullable','string'],
        ]);

        $q = User::query()->select(['id','name','email','avatar','bio']);

        if ($request->filled('search')) {
            $s = $request->get('search');
            $q->where(function($r) use ($s) {
                $r->where('name','ilike',"%{$s}%")
                  ->orWhere('email','ilike',"%{$s}%");
            });
        }

        if ($request->filled('role')) {
            $q->whereHas('roles', function($qr) use ($request){
                $qr->where('name', $request->get('role'));
            });
        }

        return $q->limit(50)->get();
    }
}
