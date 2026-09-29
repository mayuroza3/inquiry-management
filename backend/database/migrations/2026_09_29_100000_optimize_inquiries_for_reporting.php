<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->timestamp('status_changed_at')->nullable()->after('status');
        });

        DB::table('inquiries')->where('status', 'in_progress')->update(['status' => 'contacted']);
        DB::table('inquiries')->where('status', 'closed')->update(['status' => 'won']);
        DB::statement('UPDATE inquiries SET status_changed_at = COALESCE(updated_at, created_at) WHERE status_changed_at IS NULL');

        Schema::table('inquiries', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('status_changed_at');
            $table->index('email');
            $table->index('contact_name');
            $table->index(['assigned_to', 'created_at']);
            $table->index(['assigned_to', 'status']);
            $table->fullText(['contact_name', 'email', 'company', 'message']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropFullText(['contact_name', 'email', 'company', 'message']);
            $table->dropIndex(['assigned_to', 'created_at']);
            $table->dropIndex(['assigned_to', 'status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status_changed_at']);
            $table->dropIndex(['email']);
            $table->dropIndex(['contact_name']);
            $table->dropColumn('status_changed_at');
        });
    }
};
