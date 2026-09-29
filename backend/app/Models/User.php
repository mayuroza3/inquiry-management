<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_SALES_MANAGER = 'sales_manager';

    public const ROLE_SALES = 'sales';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_SALES_MANAGER,
        self::ROLE_SALES,
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_approved',
        'manager_id',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_approved' => 'boolean',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'manager_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(self::class, 'manager_id');
    }

    public function assignedInquiries(): HasMany
    {
        return $this->hasMany(Inquiry::class, 'assigned_to');
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isSalesManager(): bool
    {
        return $this->role === self::ROLE_SALES_MANAGER;
    }

    public function isApproved(): bool
    {
        return (bool) $this->is_approved;
    }

    public function canExport(): bool
    {
        return $this->isAdmin() || $this->isSalesManager();
    }

    /** @var list<int>|null */
    protected ?array $teamIdCache = null;

    /**
     * This user plus everyone who reports up to them.
     * One recursive query, reused for the rest of the request on this model.
     *
     * @return list<int>
     */
    public function teamIds(): array
    {
        if ($this->teamIdCache !== null) {
            return $this->teamIdCache;
        }

        $rows = DB::select(
            'WITH RECURSIVE team AS (
                SELECT id FROM users WHERE id = ?
                UNION ALL
                SELECT users.id FROM users INNER JOIN team ON users.manager_id = team.id
            )
            SELECT id FROM team',
            [$this->id]
        );

        return $this->teamIdCache = array_map(fn ($row) => (int) $row->id, $rows);
    }
}
