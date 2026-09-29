<x-mail::message>
# New inquiry

**{{ $inquiry->contact_name }}** ({{ $inquiry->email }}) submitted an inquiry.

@if ($inquiry->company)
Company: {{ $inquiry->company }}
@endif

@if ($inquiry->phone)
Phone: {{ $inquiry->phone }}
@endif

{{ $inquiry->message }}

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
