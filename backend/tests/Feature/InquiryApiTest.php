<?php

namespace Tests\Feature;

use App\Listeners\SendInquiryCreatedEmail;
use App\Mail\InquiryCreatedMail;
use App\Models\Inquiry;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class InquiryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_inquiry_is_stored_and_notifies_by_email(): void
    {
        Mail::fake();
        config(['mail.inquiry_notify' => 'notify@example.com']);

        $response = $this->postJson('/api/inquiries', [
            'contact_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'message' => 'We would like a demo.',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('inquiries', [
            'email' => 'ada@example.com',
            'status' => 'new',
        ]);
        Mail::assertSent(InquiryCreatedMail::class, function (InquiryCreatedMail $mail) {
            return str_contains($mail->render(), 'Ada Lovelace');
        });
    }

    public function test_inquiry_notification_is_queued_and_does_not_send_during_the_request(): void
    {
        Queue::fake();
        config(['mail.inquiry_notify' => 'notify@example.com']);

        $this->postJson('/api/inquiries', [
            'contact_name' => 'Queue Lead',
            'email' => 'queue.lead@example.com',
            'message' => 'Please confirm this was queued.',
        ])->assertCreated();

        Queue::assertPushed(CallQueuedListener::class, 1);
        Queue::assertPushed(CallQueuedListener::class, function (CallQueuedListener $job) {
            return $job->class === SendInquiryCreatedEmail::class;
        });
    }

    public function test_public_inquiry_accepts_documents_and_rejects_other_files(): void
    {
        Mail::fake();

        $this->post('/api/inquiries', [
            'contact_name' => 'Doc Lead',
            'email' => 'doc@example.com',
            'phone' => '+1 (555) 010-2000',
            'message' => 'See the attached brief.',
            'attachment' => UploadedFile::fake()->create('brief.docx', 20, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ])->assertCreated();

        $this->post('/api/inquiries', [
            'contact_name' => 'Sheet Lead',
            'email' => 'sheet@example.com',
            'message' => 'See the spreadsheet.',
            'attachment' => UploadedFile::fake()->create('numbers.xlsx', 20, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ])->assertCreated();

        $this->post('/api/inquiries', [
            'contact_name' => 'Photo Lead',
            'email' => 'photo@example.com',
            'message' => 'See the image.',
            'attachment' => UploadedFile::fake()->image('site.png'),
        ])->assertCreated();

        $this->post('/api/inquiries', [
            'contact_name' => 'Bad File',
            'email' => 'bad@example.com',
            'message' => 'This file is not allowed.',
            'attachment' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        ])->assertUnprocessable()->assertJsonValidationErrors('attachment');

        $this->postJson('/api/inquiries', [
            'contact_name' => 'Bad Phone',
            'email' => 'phone@example.com',
            'phone' => 'qfdsfff',
            'message' => 'Call me.',
        ])->assertUnprocessable()->assertJsonValidationErrors('phone');

        $this->postJson('/api/inquiries', [
            'contact_name' => 'Mayur',
            'email' => 'not-an-email',
            'company' => 'zsvs!#~!#%)__"""',
            'message' => '<script>alert(1)</script>',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'company', 'message']);
    }

    public function test_login_returns_the_user_and_an_http_only_token_cookie(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'role' => User::ROLE_ADMIN,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'admin@example.com')
            ->assertJsonPath('user.role', User::ROLE_ADMIN)
            ->assertCookie('token');
    }

    public function test_a_user_can_view_their_profile_and_change_only_the_password(): void
    {
        $manager = User::factory()->create(['name' => 'Sales Manager', 'role' => User::ROLE_SALES_MANAGER]);
        $sales = User::factory()->create([
            'name' => 'Alex Sales',
            'email' => 'alex@example.com',
            'role' => User::ROLE_SALES,
            'manager_id' => $manager->id,
        ]);
        $token = auth('api')->login($sales);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.name', 'Alex Sales')
            ->assertJsonPath('user.email', 'alex@example.com')
            ->assertJsonPath('user.role', User::ROLE_SALES)
            ->assertJsonPath('user.manager.name', 'Sales Manager');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'replaced-1',
                'password_confirmation' => 'replaced-1',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('replaced-1', $sales->fresh()->password));

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'another-pass',
                'password_confirmation' => 'another-pass',
            ])
            ->assertUnprocessable();
    }

    public function test_sales_user_cannot_export_or_list_users(): void
    {
        $sales = User::factory()->create(['role' => User::ROLE_SALES]);
        $token = auth('api')->login($sales);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->get('/api/inquiries/export')
            ->assertForbidden();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_admin_lists_every_inquiry_and_can_export_csv(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Inquiry::factory()->count(2)->create();
        $token = auth('api')->login($admin);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/inquiries')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $export = $this->withHeader('Authorization', 'Bearer '.$token)
            ->get('/api/inquiries/export');

        $export->assertOk();
        $this->assertStringContainsString('text/csv', (string) $export->headers->get('content-type'));
        $this->assertStringContainsString('Name', $export->streamedContent());
    }

    public function test_dashboard_stats_compare_the_current_period_with_the_previous_one(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        Inquiry::factory()->create([
            'created_at' => now()->subDays(2),
            'status_changed_at' => now()->subDays(2),
            'status' => 'new',
        ]);
        Inquiry::factory()->create([
            'created_at' => now()->subDays(40),
            'status_changed_at' => now()->subDays(40),
            'status' => 'won',
        ]);

        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/inquiries/stats?days=30');

        $response->assertOk();
        $response->assertJsonPath('received.current', 1);
        $response->assertJsonPath('received.previous', 1);
        $response->assertJsonPath('open', 1);
        $response->assertJsonPath('closed', 1);
        $this->assertCount(30, $response->json('series'));
    }

    public function test_public_inquiries_are_auto_assigned_and_staff_actions_are_logged(): void
    {
        $busy = User::factory()->create(['name' => 'Busy Sales', 'role' => User::ROLE_SALES]);
        $free = User::factory()->create(['name' => 'Free Sales', 'role' => User::ROLE_SALES]);
        Inquiry::factory()->create([
            'assigned_to' => $busy->id,
            'status' => 'new',
        ]);

        $created = $this->postJson('/api/inquiries', [
            'contact_name' => 'New Lead',
            'email' => 'lead@example.com',
            'message' => 'Please assign this.',
        ]);

        $created->assertCreated();
        $this->assertDatabaseHas('inquiries', [
            'email' => 'lead@example.com',
            'assigned_to' => $free->id,
        ]);
        $this->assertDatabaseHas('activities', [
            'action' => 'inquiry.auto_assigned',
            'inquiry_id' => $created->json('id'),
        ]);

        $token = auth('api')->login($free);
        $inquiryId = $created->json('id');
        $signed = fn (string $path) => $this->signedPath($path, $free, 'inquiry', $inquiryId);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->patchJson($signed('/api/inquiries/'.$inquiryId), ['status' => 'contacted'])
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson($signed('/api/inquiries/'.$inquiryId.'/notes'), ['body' => 'Spoke with them.'])
            ->assertCreated();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson($signed('/api/inquiries/'.$inquiryId.'/comments'), ['body' => 'Do not mention pricing yet.'])
            ->assertCreated();

        $show = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson($signed('/api/inquiries/'.$inquiryId));

        $show->assertOk()
            ->assertJsonPath('data.notes.0.body', 'Spoke with them.')
            ->assertJsonPath('data.comments.0.body', 'Do not mention pricing yet.')
            ->assertJsonFragment(['action' => 'inquiry.status_changed'])
            ->assertJsonFragment(['action' => 'note.added'])
            ->assertJsonFragment(['action' => 'comment.added']);
    }

    public function test_this_weeks_open_reminders_are_listed_for_visible_inquiries(): void
    {
        $sales = User::factory()->create(['role' => User::ROLE_SALES]);
        $own = Inquiry::factory()->create(['assigned_to' => $sales->id]);
        $other = Inquiry::factory()->create();

        Reminder::query()->create([
            'inquiry_id' => $own->id,
            'user_id' => $sales->id,
            'message' => 'Call this week',
            'remind_at' => now()->startOfWeek()->addDay(),
            'is_completed' => false,
        ]);
        Reminder::query()->create([
            'inquiry_id' => $own->id,
            'user_id' => $sales->id,
            'message' => 'Already done',
            'remind_at' => now()->startOfWeek()->addDays(2),
            'is_completed' => true,
        ]);
        Reminder::query()->create([
            'inquiry_id' => $other->id,
            'user_id' => $sales->id,
            'message' => 'Someone else',
            'remind_at' => now()->startOfWeek()->addDay(),
            'is_completed' => false,
        ]);

        $token = auth('api')->login($sales);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/reminders')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.message', 'Call this week')
            ->assertJsonPath('data.0.inquiry.contact_name', $own->contact_name);
    }

    public function test_inquiry_urls_require_a_signature_for_the_current_user(): void
    {
        $owner = User::factory()->create(['role' => User::ROLE_SALES]);
        $other = User::factory()->create(['role' => User::ROLE_SALES]);
        $inquiry = Inquiry::factory()->create(['assigned_to' => $owner->id]);
        $ownerToken = auth('api')->login($owner);
        $otherToken = auth('api')->login($other);
        app(\Tymon\JWTAuth\JWT::class)->unsetToken();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$ownerToken)
            ->getJson('/api/inquiries/'.$inquiry->id)
            ->assertForbidden();

        app(\Tymon\JWTAuth\JWT::class)->unsetToken();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$otherToken)
            ->getJson($this->signedPath('/api/inquiries/'.$inquiry->id, $owner, 'inquiry', $inquiry->id))
            ->assertForbidden();

        app(\Tymon\JWTAuth\JWT::class)->unsetToken();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$otherToken)
            ->getJson($this->signedPath('/api/inquiries/'.$inquiry->id, $other, 'inquiry', $inquiry->id))
            ->assertForbidden();

        app(\Tymon\JWTAuth\JWT::class)->unsetToken();
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$ownerToken)
            ->getJson($this->signedPath('/api/inquiries/'.$inquiry->id, $owner, 'inquiry', $inquiry->id))
            ->assertOk()
            ->assertJsonPath('data.id', $inquiry->id);
    }

    public function test_inquiry_list_defaults_to_newest_received_and_sorts_name_and_assignee(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $amy = User::factory()->create(['name' => 'Amy Agent', 'role' => User::ROLE_SALES]);
        $zoe = User::factory()->create(['name' => 'Zoe Agent', 'role' => User::ROLE_SALES]);

        $mona = Inquiry::factory()->create([
            'contact_name' => 'Mona',
            'assigned_to' => $zoe->id,
        ]);
        $adam = Inquiry::factory()->create([
            'contact_name' => 'Adam',
            'assigned_to' => null,
        ]);
        $zara = Inquiry::factory()->create([
            'contact_name' => 'Zara',
            'assigned_to' => $amy->id,
        ]);
        $mona->forceFill(['created_at' => '2026-01-02 00:00:00'])->save();
        $zara->forceFill(['created_at' => '2026-02-02 00:00:00'])->save();
        $adam->forceFill(['created_at' => '2026-03-03 00:00:00'])->save();

        $token = auth('api')->login($admin);

        $names = fn (string $query = '') => collect(
            $this->withHeader('Authorization', 'Bearer '.$token)
                ->getJson('/api/inquiries'.$query)
                ->assertOk()
                ->json('data')
        )->pluck('contact_name')->all();

        $this->assertSame(['Adam', 'Zara', 'Mona'], $names());
        $this->assertSame(['Adam', 'Mona', 'Zara'], $names('?sort=name&direction=asc'));
        $this->assertSame(['Zara', 'Mona', 'Adam'], $names('?sort=assignee&direction=asc'));
        $this->assertSame(['Mona', 'Zara', 'Adam'], $names('?sort=received&direction=asc'));
        $this->assertSame(['Adam', 'Zara', 'Mona'], $names('?sort=id&direction=asc'));
    }
}
