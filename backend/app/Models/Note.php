<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    public const KIND_NOTE = 'note';

    public const KIND_COMMENT = 'comment';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'inquiry_id',
        'user_id',
        'kind',
        'body',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
