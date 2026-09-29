<?php

namespace App\Http\Controllers;

use App\Models\LeadSource;
use Illuminate\Http\JsonResponse;

class LeadSourceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => LeadSource::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
