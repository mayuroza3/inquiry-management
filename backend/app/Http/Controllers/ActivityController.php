<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Inquiry::class);

        $user = $request->user();
        $query = Activity::query()
            ->with(['user:id,name', 'inquiry:id,contact_name'])
            ->latest('created_at');

        if (! $user->isAdmin()) {
            $query->where(function ($inner) use ($user): void {
                $inner->whereIn('inquiry_id', Inquiry::query()->visibleTo($user)->select('id'))
                    ->orWhere(function ($own) use ($user): void {
                        $own->whereNull('inquiry_id')->where('user_id', $user->id);
                    });
            });
        }

        return ActivityResource::collection(
            $query->paginate(min($request->integer('per_page', 20), 50))
        )->response();
    }
}
