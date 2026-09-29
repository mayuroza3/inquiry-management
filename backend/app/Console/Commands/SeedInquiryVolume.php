<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class SeedInquiryVolume extends Command
{
    protected $signature = 'inquiries:seed-volume {--count=12000}';

    protected $description = 'Insert a year of fake inquiries for dashboard and list stress tests';

    public function handle(): int
    {
        $count = max(1, (int) $this->option('count'));
        $users = DB::table('users')->pluck('id')->all();
        $sources = DB::table('lead_sources')->pluck('id')->all();

        if ($users === []) {
            $this->error('No users exist to assign inquiries to.');

            return self::FAILURE;
        }

        $files = $this->sampleFiles();
        $start = strtotime('2025-08-01 00:00:00');
        $end = strtotime('2026-09-29 18:29:59');
        $statuses = ['new', 'new', 'contacted', 'contacted', 'pending', 'qualified', 'won', 'lost'];
        $firstNames = ['Asha', 'Rohan', 'Meera', 'Kabir', 'Neel', 'Isha', 'Arun', 'Diya', 'Vikram', 'Sara', 'Owen', 'Lila', 'Noah', 'Priya', 'Elena', 'Marcus'];
        $lastNames = ['Shah', 'Mehta', 'Nair', 'Iyer', 'Khan', 'Diaz', 'Cole', 'Patel', 'Brooks', 'Nguyen', 'Shahid', 'Fernandes', 'Kapoor', 'Reid'];
        $companies = ['Northwind Labs', 'Cedar Freight', 'Harbor Clinic', 'Brightline Studio', 'Oak and Co', 'Summit Retail', 'Bluefield Health', 'Pioneer Foods'];
        $messages = [
            'We need a quote for a follow-up portal for our sales team.',
            'Please share pricing for a pilot with our regional office.',
            'Looking for a way to track new leads through to a decision.',
            'Can someone call us about onboarding the inquiry form?',
            'We want a walkthrough of reminders, notes, and assignment.',
        ];

        $this->info("Inserting {$count} inquiries.");
        $nowStamp = now()->toDateTimeString();
        $chunk = [];

        for ($index = 1; $index <= $count; $index++) {
            $created = date('Y-m-d H:i:s', random_int($start, $end));
            $status = $statuses[array_rand($statuses)];
            $changed = $status === 'new'
                ? $created
                : date('Y-m-d H:i:s', min($end, strtotime($created) + random_int(0, 20) * 86400));
            $first = $firstNames[array_rand($firstNames)];
            $last = $lastNames[array_rand($lastNames)];

            $chunk[] = [
                'contact_name' => $first.' '.$last,
                'email' => 'stress.'.$index.'@example.com',
                'phone' => '9'.str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
                'company' => random_int(1, 100) <= 80 ? $companies[array_rand($companies)] : null,
                'message' => $messages[array_rand($messages)],
                'status' => $status,
                'status_changed_at' => $changed,
                'assigned_to' => $users[array_rand($users)],
                'lead_source_id' => $sources === [] || random_int(1, 100) <= 10 ? null : $sources[array_rand($sources)],
                'created_at' => $created,
                'updated_at' => $changed,
            ];

            if (count($chunk) === 500) {
                DB::table('inquiries')->insert($chunk);
                $chunk = [];
            }
        }

        if ($chunk !== []) {
            DB::table('inquiries')->insert($chunk);
        }

        $rows = DB::table('inquiries')
            ->where('email', 'like', 'stress.%@example.com')
            ->get(['id', 'assigned_to', 'created_at']);

        $notes = [];
        $attachments = [];
        $activities = [];
        $noteCount = 0;
        $commentCount = 0;
        $fileCount = 0;

        foreach ($rows as $row) {
            $activities[] = [
                'user_id' => $row->assigned_to,
                'inquiry_id' => $row->id,
                'action' => 'inquiry.created',
                'summary' => 'Inquiry submitted from the public form.',
                'properties' => null,
                'created_at' => $row->created_at,
            ];

            $roll = random_int(1, 100);
            if ($roll <= 30) {
                $notes[] = $this->note($row, 'note', 'Called the contact and agreed a follow-up.');
                $noteCount++;
            }
            if ($roll <= 15) {
                $notes[] = $this->note($row, 'comment', 'Internal only. Hold the discount until the next call.');
                $commentCount++;
            }
            if ($roll <= 10) {
                $file = $files[array_rand($files)];
                $attachments[] = [
                    'inquiry_id' => $row->id,
                    'disk' => 'local',
                    'path' => $file['path'],
                    'original_name' => $file['name'],
                    'mime_type' => $file['mime'],
                    'size' => $file['size'],
                    'created_at' => $row->created_at,
                    'updated_at' => $row->created_at,
                ];
                $fileCount++;
            }

            if (count($notes) >= 500) {
                DB::table('notes')->insert($notes);
                $notes = [];
            }
            if (count($attachments) >= 500) {
                DB::table('attachments')->insert($attachments);
                $attachments = [];
            }
            if (count($activities) >= 500) {
                DB::table('activities')->insert($activities);
                $activities = [];
            }
        }

        if ($notes !== []) {
            DB::table('notes')->insert($notes);
        }
        if ($attachments !== []) {
            DB::table('attachments')->insert($attachments);
        }
        if ($activities !== []) {
            DB::table('activities')->insert($activities);
        }

        $this->info("Inquiries: {$rows->count()}. Notes: {$noteCount}. Comments: {$commentCount}. Attachments: {$fileCount}.");
        $this->comment('Sample files were stored once and reused. Created at '.$nowStamp.'.');

        return self::SUCCESS;
    }

    /**
     * @return array{inquiry_id: int, user_id: int, kind: string, body: string, created_at: string, updated_at: string}
     */
    private function note(object $row, string $kind, string $body): array
    {
        return [
            'inquiry_id' => $row->id,
            'user_id' => $row->assigned_to,
            'kind' => $kind,
            'body' => $body,
            'created_at' => $row->created_at,
            'updated_at' => $row->created_at,
        ];
    }

    /**
     * @return list<array{path: string, name: string, mime: string, size: int}>
     */
    private function sampleFiles(): array
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        Storage::disk('local')->put('stress/sample.png', $png);
        $docx = $this->docx();
        Storage::disk('local')->put('stress/sample.docx', $docx);

        return [
            ['path' => 'stress/sample.png', 'name' => 'site-photo.png', 'mime' => 'image/png', 'size' => strlen($png)],
            ['path' => 'stress/sample.docx', 'name' => 'brief.docx', 'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'size' => strlen($docx)],
        ];
    }

    private function docx(): string
    {
        $path = storage_path('app/stress-brief.docx');
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Sample brief for the inquiry.</w:t></w:r></w:p></w:body></w:document>');
        $zip->close();
        $bytes = (string) file_get_contents($path);
        unlink($path);

        return $bytes;
    }
}
