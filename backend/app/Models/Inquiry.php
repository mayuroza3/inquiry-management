<?php

namespace App\Models;

use Database\Factories\InquiryFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    /** @use HasFactory<InquiryFactory> */
    use HasFactory;

    public const STATUSES = [
        'new',
        'contacted',
        'pending',
        'qualified',
        'won',
        'lost',
    ];

    public const OPEN_STATUSES = [
        'new',
        'contacted',
        'qualified',
    ];

    public static function labelFor(string $status): string
    {
        return match ($status) {
            'new' => 'New',
            'contacted' => 'Contacted',
            'pending' => 'Pending',
            'qualified' => 'Qualified',
            'won' => 'Won',
            'lost' => 'Lost',
            default => $status,
        };
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'contact_name',
        'email',
        'phone',
        'company',
        'message',
        'status',
        'status_changed_at',
        'assigned_to',
        'lead_source_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status_changed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Inquiry $inquiry): void {
            $inquiry->status_changed_at ??= now();
        });

        static::updating(function (Inquiry $inquiry): void {
            if ($inquiry->isDirty('status')) {
                $inquiry->status_changed_at = now();
            }
        });
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class)->where('kind', Note::KIND_NOTE);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Note::class)->where('kind', Note::KIND_COMMENT);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->whereIn('assigned_to', $user->teamIds());
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = mb_substr(trim((string) $term), 0, 100);

        if ($term === '' || ! preg_match('/^[\p{L}\p{N}\s@.+_\-]+$/u', $term)) {
            return $query;
        }

        $prefix = str_replace(['%', '_'], ['\\%', '\\_'], $term).'%';

        return $query->where(function (Builder $inner) use ($term, $prefix) {
            $inner->where('contact_name', 'like', $prefix)
                ->orWhere('email', 'like', $prefix)
                ->orWhere('company', 'like', $prefix);

            $fullText = trim((string) preg_replace('/[+\-<>()~*"@]+/', ' ', $term));

            if (mb_strlen($fullText) >= 3) {
                $inner->orWhereFullText(['contact_name', 'email', 'company', 'message'], $fullText);
            }
        });
    }
}
