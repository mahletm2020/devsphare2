<?php

namespace Database\Seeders;

use App\Models\Skill;
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
        // Create all roles
        $roles = ['super_admin', 'organizer', 'sponsor', 'participant', 'judge', 'mentor'];
        
        foreach ($roles as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'web'
            ]);
        }

        // Create sample skills
        $skills = [
            'PHP', 'Laravel', 'JavaScript', 'React', 'Vue.js', 'Node.js',
            'Python', 'Django', 'AI/ML', 'Data Science', 'UI/UX Design',
            'Mobile Development', 'DevOps', 'Cloud Computing', 'Blockchain'
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(['name' => $skill]);
        }

        // Create super admin (always update password to ensure it's correct)
        $superAdmin = User::firstOrCreate(
            ['email' => 'Superadmin@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('superpassword'),
                'email_verified_at' => now(),
                'is_searchable' => false,
                'is_willing_judge' => true,
                'is_willing_mentor' => true,
            ]
        );
        // Always update password to ensure it's correct
        $superAdmin->update([
            'password' => bcrypt('superpassword'),
            'email_verified_at' => now(),
        ]);
        $superAdmin->assignRole('super_admin');

        // Create sample organizer
        $organizer = User::firstOrCreate(
            ['email' => 'organizer@example.com'],
            [
                'name' => 'John Organizer',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
                'is_searchable' => true,
                'is_willing_judge' => false,
                'is_willing_mentor' => true,
            ]
        );
        $organizer->assignRole('organizer');

        // Create sample sponsor
        $sponsor = User::firstOrCreate(
            ['email' => 'sponsor@example.com'],
            [
                'name' => 'Tech Corp Sponsors',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
                'is_searchable' => true,
                'is_willing_judge' => false,
                'is_willing_mentor' => false,
            ]
        );
        $sponsor->assignRole('sponsor');

        // Create sample participants
        $participants = [
            ['name' => 'Alice Participant', 'email' => 'alice@example.com', 'is_willing_judge' => true],
            ['name' => 'Bob Developer', 'email' => 'bob@example.com', 'is_willing_mentor' => true],
            ['name' => 'Charlie Coder', 'email' => 'charlie@example.com', 'is_willing_judge' => true],
        ];

        foreach ($participants as $participantData) {
            $participant = User::firstOrCreate(
                ['email' => $participantData['email']],
                [
                    'name' => $participantData['name'],
                    'password' => bcrypt('password123'),
                    'email_verified_at' => now(),
                    'is_searchable' => true,
                    'is_willing_judge' => $participantData['is_willing_judge'] ?? false,
                    'is_willing_mentor' => $participantData['is_willing_mentor'] ?? false,
                ]
            );
            $participant->assignRole('participant');
            
            // Assign random skills
            $randomSkills = Skill::inRandomOrder()->limit(3)->pluck('id');
            $participant->skills()->sync($randomSkills);
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Super Admin: Superadmin@gmail.com / superpassword');
        $this->command->info('Organizer: organizer@example.com / password123');
        $this->command->info('Sponsor: sponsor@example.com / password123');
    }
}