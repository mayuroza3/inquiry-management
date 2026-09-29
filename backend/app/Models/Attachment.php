<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'inquiry_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class);
    }
}
