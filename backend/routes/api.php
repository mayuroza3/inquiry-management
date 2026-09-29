<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/lead-sources', [LeadSourceController::class, 'index']);
Route::post('/inquiries', [InquiryController::class, 'store'])->middleware('throttle:30,1');

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/profile/password', [AuthController::class, 'updatePassword']);
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::get('/team', [InquiryController::class, 'team']);

    Route::get('/inquiries/export', [InquiryController::class, 'export']);
    Route::get('/inquiries/stats', [InquiryController::class, 'stats']);
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show'])->middleware('signed.access:inquiry');
    Route::patch('/inquiries/{inquiry}', [InquiryController::class, 'update'])->middleware('signed.access:inquiry');
    Route::post('/inquiries/{inquiry}/notes', [NoteController::class, 'store'])->middleware('signed.access:inquiry');
    Route::post('/inquiries/{inquiry}/comments', [NoteController::class, 'storeComment'])->middleware('signed.access:inquiry');
    Route::post('/inquiries/{inquiry}/reminders', [ReminderController::class, 'store'])->middleware('signed.access:inquiry');
    Route::get('/inquiries/{inquiry}/attachments/{attachment}', [AttachmentController::class, 'download'])->middleware('signed.access:attachment');
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::patch('/reminders/{reminder}', [ReminderController::class, 'update'])->middleware('signed.access:reminder');

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update'])->middleware('signed.access:user');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('signed.access:user');
    });
});
