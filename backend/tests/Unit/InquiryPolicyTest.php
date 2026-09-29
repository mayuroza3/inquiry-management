<?php

namespace Tests\Unit;

use App\Models\Inquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class InquiryPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_export_every_inquiry(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $inquiry = Inquiry::factory()->create();

        $this->assertTrue(Gate::forUser($admin)->allows('view', $inquiry));
        $this->assertTrue(Gate::forUser($admin)->allows('export', Inquiry::class));
    }

    public function test_sales_user_can_view_only_own_inquiries(): void
    {
        $sales = User::factory()->create(['role' => User::ROLE_SALES]);
        $other = User::factory()->create(['role' => User::ROLE_SALES]);
        $own = Inquiry::factory()->create(['assigned_to' => $sales->id]);
        $foreign = Inquiry::factory()->create(['assigned_to' => $other->id]);

        $this->assertTrue(Gate::forUser($sales)->allows('view', $own));
        $this->assertFalse(Gate::forUser($sales)->allows('view', $foreign));
        $this->assertFalse(Gate::forUser($sales)->allows('export', Inquiry::class));
    }

    public function test_sales_manager_can_view_the_reporting_hierarchy(): void
    {
        $manager = User::factory()->create(['role' => User::ROLE_SALES_MANAGER]);
        $report = User::factory()->create([
            'role' => User::ROLE_SALES,
            'manager_id' => $manager->id,
        ]);
        $outsider = User::factory()->create(['role' => User::ROLE_SALES]);

        $teamInquiry = Inquiry::factory()->create(['assigned_to' => $report->id]);
        $ownInquiry = Inquiry::factory()->create(['assigned_to' => $manager->id]);
        $outsideInquiry = Inquiry::factory()->create(['assigned_to' => $outsider->id]);
        $unassigned = Inquiry::factory()->create(['assigned_to' => null]);

        $gate = Gate::forUser($manager);

        $this->assertTrue($gate->allows('view', $teamInquiry));
        $this->assertTrue($gate->allows('view', $ownInquiry));
        $this->assertFalse($gate->allows('view', $outsideInquiry));
        $this->assertFalse($gate->allows('view', $unassigned));
        $this->assertTrue($gate->allows('export', Inquiry::class));
    }
}
