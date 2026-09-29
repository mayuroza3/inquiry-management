<x-mail::message>
# Password Reset Request

You requested to reset your password for **{{ $email }}**.

Click the button below to set a new password:

<x-mail::button :url="$resetUrl">
Reset Password
</x-mail::button>

If you did not request a password reset, no further action is required. This password reset link will expire in 60 minutes.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
