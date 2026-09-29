<?php

namespace Database\Seeders;

use App\Models\Inquiry;
use App\Models\LeadSource;
use App\Models\Note;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => User::ROLE_ADMIN,
        ]);

        $manager = User::factory()->create([
            'name' => 'Sales Manager',
            'email' => 'manager@example.com',
            'role' => User::ROLE_SALES_MANAGER,
            'manager_id' => $admin->id,
        ]);

        $alex = User::factory()->create([
            'name' => 'Alex Sales',
            'email' => 'sales@example.com',
            'role' => User::ROLE_SALES,
            'manager_id' => $manager->id,
        ]);

        $blair = User::factory()->create([
            'name' => 'Blair Sales',
            'email' => 'sales2@example.com',
            'role' => User::ROLE_SALES,
            'manager_id' => $manager->id,
        ]);

        $sources = collect(['Website', 'Referral', 'Phone', 'Email'])
            ->map(fn (string $name) => LeadSource::query()->create(['name' => $name]));

        $alexInquiry = Inquiry::factory()->create([
            'contact_name' => 'Priya Shah',
            'email' => 'priya@example.com',
            'company' => 'Northwind Labs',
            'message' => 'We need a quote for an on-premise inquiry portal.',
            'status' => 'contacted',
            'assigned_to' => $alex->id,
            'lead_source_id' => $sources[0]->id,
        ]);

        Note::query()->create([
            'inquiry_id' => $alexInquiry->id,
            'user_id' => $alex->id,
            'kind' => 'note',
            'body' => 'Called Priya. She wants a walkthrough next week.',
        ]);

        Note::query()->create([
            'inquiry_id' => $alexInquiry->id,
            'user_id' => $manager->id,
            'kind' => 'comment',
            'body' => 'Keep the discount off the customer note. Internal only.',
        ]);

        Reminder::query()->create([
            'inquiry_id' => $alexInquiry->id,
            'user_id' => $alex->id,
            'message' => 'Send the proposal',
            'remind_at' => now()->addDays(2),
        ]);

        Inquiry::factory()->create([
            'contact_name' => 'Omar Haddad',
            'email' => 'omar@example.com',
            'company' => 'Cedar Freight',
            'message' => 'Looking for a sales follow-up tool for our regional team.',
            'status' => 'new',
            'assigned_to' => $blair->id,
            'lead_source_id' => $sources[1]->id,
        ]);

        Inquiry::factory()->create([
            'contact_name' => 'Lina Costa',
            'email' => 'lina@example.com',
            'company' => 'Harbor Clinic',
            'message' => 'Please contact our operations lead about a pilot.',
            'status' => 'qualified',
            'assigned_to' => $manager->id,
            'lead_source_id' => $sources[2]->id,
        ]);

        Inquiry::factory()->create([
            'contact_name' => 'Website Visitor',
            'email' => 'visitor@example.com',
            'company' => null,
            'message' => 'General question about pricing. Not assigned yet.',
            'status' => 'new',
            'assigned_to' => null,
            'lead_source_id' => $sources[0]->id,
        ]);
    }
}
