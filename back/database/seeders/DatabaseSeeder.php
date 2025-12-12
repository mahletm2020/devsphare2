<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create all roles we may use
        $roles = [
            'super_admin', 'admin', 'organizer', 'sponsor',
            'judge', 'mentor', 'participant'
        ];
    
        foreach (['super_admin', 'organizer', 'sponsor', 'participant', 'judge', 'mentor'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    
        // Create a super admin user (if not exists)
        $admin = User::firstWhere('email', 'admin@example.com');
        if (! $admin) {
            $admin = User::factory()->create([
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => 'password123', // model will hash
            ]);
        }
        $admin->assignRole('super_admin');
    }
    
}
