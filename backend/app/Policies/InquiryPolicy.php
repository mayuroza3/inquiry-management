<?php

namespace App\Policies;

use App\Models\Inquiry;
use App\Models\User;

class InquiryPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if (! $user->isApproved()) {
            return false;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Inquiry $inquiry): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($inquiry->assigned_to === null) {
            return false;
        }

        return in_array((int) $inquiry->assigned_to, $user->teamIds(), true);
    }

    public function update(User $user, Inquiry $inquiry): bool
    {
        return $this->view($user, $inquiry);
    }

    public function export(User $user): bool
    {
        return $user->canExport();
    }
}
