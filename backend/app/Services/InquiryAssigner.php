<?php

namespace App\Services;

use App\Models\Inquiry;
use App\Models\User;

class InquiryAssigner
{
    /**
     * Give a new inquiry to the person with the fewest active inquiries.
     * Sales staff are preferred, then sales managers, then admins.
     */
    public function assign(Inquiry $inquiry): ?User
    {
        $assignee = $this->leastLoaded(User::ROLE_SALES)
            ?? $this->leastLoaded(User::ROLE_SALES_MANAGER)
            ?? $this->leastLoaded(User::ROLE_ADMIN);

        if ($assignee === null) {
            return null;
        }

        $inquiry->forceFill(['assigned_to' => $assignee->id])->save();

        return $assignee;
    }

    private function leastLoaded(string $role): ?User
    {
        return User::query()
            ->where('role', $role)
            ->withCount([
                'assignedInquiries as open_inquiries_count' => function ($query): void {
                    $query->whereIn('status', ['new', 'contacted', 'pending', 'qualified']);
                },
            ])
            ->orderBy('open_inquiries_count')
            ->orderBy('id')
            ->first();
    }
}
